import BigNumber from 'bignumber.js'
import { AxiosResponse } from 'axios'
import { numberToHex, AbiItem } from 'web3-utils'
import Web3 from 'web3'
import { SwapError } from '../../../../api'
import { Asset, ChainTypes, Quote, QuoteResponse, SwapperType } from '@shapeshiftoss/types'
import { AxiosResponse } from 'axios'
import { HDWallet } from '@shapeshiftoss/hdwallet-core'
import { ChainAdapter } from '@shapeshiftoss/chain-adapters'
import { zrxService } from '../zrxService'
import { SwapError } from '../../../../api'
import { ZrxError } from '../../ZrxSwapper'
import { DEFAULT_ETH_PATH } from '../constants'

export type GetAllowanceRequiredArgs = {
  quote: Quote<ChainTypes, SwapperType>
  web3: Web3
  erc20AllowanceAbi: AbiItem[]
}

export type GetERC20AllowanceDeps = {
  erc20AllowanceAbi: AbiItem[]
  web3: Web3
}

export type GetERC20AllowanceArgs = {
  tokenId: string
  ownerAddress: string
  spenderAddress: string
}

type GrantAllowanceArgs = {
  quote: Quote
  wallet: HDWallet
  adapter: ChainAdapter<ChainTypes>
  erc20Abi: AbiItem[]
  web3: Web3
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

export const getERC20Allowance = (
  { erc20AllowanceAbi, web3 }: GetERC20AllowanceDeps,
  { tokenId, ownerAddress, spenderAddress }: GetERC20AllowanceArgs
) => {
  const erc20Contract = new web3.eth.Contract(erc20AllowanceAbi, tokenId)
  return erc20Contract.methods.allowance(ownerAddress, spenderAddress).call()
}

export const getAllowanceRequired = async ({
  quote,
  web3,
  erc20AllowanceAbi
}: GetAllowanceRequiredArgs): Promise<BigNumber> => {
  if (quote.sellAsset.symbol === 'ETH') {
    return new BigNumber(0)
  }

  const ownerAddress = quote.receiveAddress as string
  const spenderAddress = quote.allowanceContract as string
  const tokenId = quote.sellAsset.tokenId as string

  const allowanceOnChain = getERC20Allowance(
    { web3, erc20AllowanceAbi },
    { ownerAddress, spenderAddress, tokenId }
  )

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

export const getUsdRate = async (input: Pick<Asset, 'symbol' | 'tokenId'>): Promise<string> => {
  const { symbol, tokenId } = input
  if (symbol === 'USDC') return '1' // Will break if comparing against usdc
  const rateResponse: AxiosResponse<QuoteResponse> = await zrxService.get<QuoteResponse>(
    '/swap/v1/price',
    {
      params: {
        buyToken: 'USDC',
        buyAmount: '1000000', // $1
        sellToken: tokenId || symbol
      }
    }
  )
  if (!rateResponse.data.price) throw new ZrxError('getUsdRate - Failed to get price data')

  return new BigNumber(1).dividedBy(rateResponse.data.price).toString()
}

export const grantAllowance = async ({
  quote,
  wallet,
  adapter,
  erc20Abi,
  web3
}: GrantAllowanceArgs): Promise<string> => {
  if (!quote.sellAsset.tokenId) {
    throw new Error('sellAsset.tokenId is required')
  }

  const erc20Contract = new web3.eth.Contract(erc20Abi, quote.sellAsset.tokenId)
  const approveTx = erc20Contract.methods
    .approve(quote.allowanceContract, quote.sellAmount)
    .encodeABI()

  const value = quote.sellAsset.symbol === 'ETH' ? numberToHex(quote.sellAmount || 0) : '0x0'
  const { txToSign } = await adapter.buildSendTransaction({
    value,
    wallet,
    to: quote.sellAsset.tokenId,
    path: DEFAULT_ETH_PATH,
    fee: numberToHex(quote.feeData?.gasPrice || 0),
    limit: numberToHex(quote.feeData?.estimatedGas || 0)
  })

  const grantAllowanceTxToSign = {
    ...txToSign,
    data: approveTx
  }

  const signedTx = await adapter.signTransaction({ txToSign: grantAllowanceTxToSign, wallet })

  return await adapter.broadcastTransaction(signedTx)
}
