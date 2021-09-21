import BigNumber from 'bignumber.js'
import Web3 from 'web3'
import { AbiItem } from 'web3-utils'
import axios, { AxiosInstance, AxiosResponse } from 'axios'
import * as rax from 'retry-axios'
import { ChainAdapter } from '@shapeshiftoss/chain-adapters'
import { HDWallet } from '@shapeshiftoss/hdwallet-core'
import { Swapper, SwapperType, Quote, GetQuoteInput, SwapError } from '../../api'
import { applyAxiosRetry } from '../../utils/applyAxiosRetry'
import { erc20AllowanceAbi } from '../../utils/abi/erc20-abi'

const DEFAULT_SLIPPAGE = new BigNumber(0.5).div(100).toString() // 0.5%
const DEFAULT_SOURCE = [{ name: '0x', proportion: '1' }]
const DEFAULT_ETH_PATH = `m/44'/60'/0'/0/0`
const AFFILIATE_ADDRESS = '0xc770eefad204b5180df6a14ee197d99d808ee52d'
const APPROVAL_GAS_LIMIT = '100000' // Most approvals are around 40k, we've seen 72k in the wild, so 100000 for safety.

type SwapperArgs = {
  adapter: ChainAdapter
  web3: Web3
}

type LiquiditySource = {
  name: string
  proportion: string
}

type QuoteResponse = {
  price: string
  guaranteedPrice: string
  to: string
  data?: string
  value?: string
  gas?: string
  estimatedGas?: string
  gasPrice?: string
  protocolFee?: string
  minimumProtocolFee?: string
  buyTokenAddress?: string
  sellTokenAddress?: string
  buyAmount?: string
  sellAmount?: string
  allowanceTarget?: string
  sources?: Array<LiquiditySource>
}

type GetAllowanceRequiredArgs = {
  quote: Quote
  web3: Web3
  erc20AllowanceAbi: AbiItem[]
}

const axiosConfig = {
  baseURL: 'https://api.0x.org/',
  timeout: 10000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }
}

/**
 * Very large amounts like those found in ERC20s with a precision of 18 get converted
 * to exponential notation ('1.6e+21') in javascript. The 0x api doesn't play well with
 * exponential notation so we need to ensure that it is represented as an integer string.
 * This function keeps 17 significant digits, so even if we try to trade 1 Billion of an
 * ETH or ERC20, we still keep 7 decimal places.
 * @param amount
 */
export const normalizeAmount = (amount: string | undefined): string | undefined => {
  if (!amount) return
  return new BigNumber(amount).toNumber().toLocaleString('fullwide', { useGrouping: false })
}

export const getAllowanceRequired = async ({
  quote,
  web3,
  erc20AllowanceAbi
}: GetAllowanceRequiredArgs): Promise<BigNumber> => {
  if (quote.sellAsset.symbol === 'ETH') {
    return new BigNumber(0)
  }

  const ownerAddress = quote.receiveAddress
  const spenderAddress = quote.allowanceContract

  const erc20Contract = new web3.eth.Contract(erc20AllowanceAbi, quote.sellAsset.tokenId)
  const allowanceOnChain = erc20Contract.methods.allowance(ownerAddress, spenderAddress).call()

  if (allowanceOnChain === '0') {
    return new BigNumber(quote.sellAmount || 0)
  }
  if (!allowanceOnChain) {
    throw new SwapError(
      `No allowance data for ${quote.allowanceContract} to ${quote.receiveAddress}`
    )
  }
  const allowanceRequired = new BigNumber(quote.sellAmount || 0).minus(allowanceOnChain)
  return allowanceRequired.lt(0) ? new BigNumber(0) : allowanceRequired
}

export class ZrxSwapper implements Swapper {
  public static swapperName = 'ZrxSwapper'
  adapter: ChainAdapter
  zrx: AxiosInstance
  web3: Web3

  constructor(args: SwapperArgs) {
    this.adapter = args.adapter
    this.zrx = axios.create(axiosConfig)
    this.web3 = args.web3
  }

  getType() {
    return SwapperType.Zrx
  }

  async buildQuoteTx(input: GetQuoteInput, wallet: HDWallet): Promise<Quote> {
    const {
      sellAsset,
      buyAsset,
      sellAmount,
      buyAmount,
      slippage,
      sellAssetAccountId,
      buyAssetAccountId,
      priceImpact
    } = input

    if (!sellAsset || !buyAsset) {
      throw new SwapError('ZrxSwapper:buildQuoteTx Both sellAsset and buyAsset are required')
    }
    if ((buyAmount && sellAmount) || (!buyAmount && !sellAmount)) {
      throw new SwapError(
        'ZrxSwapper:buildQuoteTx Exactly one of buyAmount or sellAmount is required'
      )
    }

    if (!sellAssetAccountId || !buyAssetAccountId) {
      throw new SwapError(
        'ZrxSwapper:buildQuoteTx Both sellAssetAccountId and buyAssetAccountId are required'
      )
    }

    const buyToken = buyAsset.tokenId || buyAsset.symbol || buyAsset.network
    const sellToken = sellAsset.tokenId || sellAsset.symbol || sellAsset.network
    if (!buyToken) {
      throw new SwapError(
        'ZrxSwapper:buildQuoteTx One of buyAssetContract or buyAssetSymbol or buyAssetNetwork are required'
      )
    }
    if (!sellToken) {
      throw new SwapError(
        'ZrxSwapper:buildQuoteTx One of sellAssetContract or sellAssetSymbol or sellAssetNetwork are required'
      )
    }

    const receiveAddress = await this.adapter.getAddress({ wallet, path: DEFAULT_ETH_PATH })

    const slippagePercentage = slippage
      ? new BigNumber(slippage).div(100).toString()
      : DEFAULT_SLIPPAGE

    try {
      /**
       * /swap/v1/quote
       * params: {
       *   sellToken: contract address (or symbol) of token to sell
       *   buyToken: contractAddress (or symbol) of token to buy
       *   sellAmount?: integer string value of the smallest increment of the sell token
       *   buyAmount?: integer string value of the smallest incremtent of the buy token
       * }
       */
      const zrxRetry = applyAxiosRetry(axios.create(axiosConfig), {
        statusCodesToRetry: [[400, 400]],
        shouldRetry: (err) => {
          const cfg = rax.getConfig(err)
          const retryAttempt = cfg?.currentRetryAttempt ?? 0
          const retry = cfg?.retry ?? 3
          // ensure max retries is always respected
          if (retryAttempt >= retry) return false
          // retry if 0x returns error code 111 Gas estimation failed
          if (err?.response?.data?.code === 111) return true

          // Handle the request based on your other config options, e.g. `statusCodesToRetry`
          return rax.shouldRetryRequest(err)
        }
      })
      const quoteResponse: AxiosResponse<QuoteResponse> = await zrxRetry.get<QuoteResponse>(
        '/swap/v1/quote',
        {
          params: {
            buyToken,
            sellToken,
            sellAmount: normalizeAmount(sellAmount?.toString()),
            buyAmount: normalizeAmount(buyAmount?.toString()),
            takerAddress: receiveAddress,
            slippagePercentage,
            skipValidation: false,
            affiliateAddress: AFFILIATE_ADDRESS
          }
        }
      )

      const { data } = quoteResponse

      const estimatedGas = new BigNumber(data.gas || 0)
      const quote: Quote = {
        sellAsset,
        buyAsset,
        sellAssetAccountId,
        buyAssetAccountId,
        receiveAddress,
        slippage,
        success: true,
        statusCode: 0,
        rate: data.price,
        depositAddress: data.to,
        feeData: {
          fee: new BigNumber(estimatedGas || 0)
            .multipliedBy(new BigNumber(data.gasPrice || 0))
            .toString(),
          estimatedGas: estimatedGas.toString(),
          gasPrice: data.gasPrice
        },
        txData: data.data,
        sellAmount: data.sellAmount,
        buyAmount: data.buyAmount,
        guaranteedPrice: data.guaranteedPrice,
        allowanceContract: data.allowanceTarget,
        sources: data.sources?.filter((s) => parseFloat(s.proportion) > 0) || DEFAULT_SOURCE,
        priceImpact
      }

      const allowanceRequired = await getAllowanceRequired({
        quote,
        web3: this.web3,
        erc20AllowanceAbi
      })
      quote.allowanceGrantRequired = allowanceRequired.gt(0)
      if (quote.allowanceGrantRequired) {
        quote.feeData = {
          ...quote.feeData,
          approvalFee: new BigNumber(APPROVAL_GAS_LIMIT).multipliedBy(data.gasPrice || 0).toString()
        }
      }
      return quote
    } catch (e) {
      if (e.status === 400) {
        return {
          sellAsset,
          buyAsset,
          success: false,
          statusCode: e.body?.code || -1,
          statusReason: e.body?.reason || 'Unknown Client Failure'
        }
      } else if (e.status === 500) {
        // TODO: Handle error
      }

      throw new SwapError(`ZrxSwapper:buildQuoteTx Error getting quote: ${e}`)
    }
  }
}
