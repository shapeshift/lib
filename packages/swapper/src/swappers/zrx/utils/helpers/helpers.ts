import { ChainAdapterManager } from '@shapeshiftoss/chain-adapters'
import { HDWallet } from '@shapeshiftoss/hdwallet-core'
import { Asset, SupportedChainIds } from '@shapeshiftoss/types'
import { AxiosResponse } from 'axios'
import BigNumber from 'bignumber.js'
import Web3 from 'web3'
import { AbiItem, numberToHex } from 'web3-utils'

import { SwapErrorTypes, TradeQuote, SwapError } from '../../../../api'
import { ZrxPriceResponse } from '../../types'
import { bn, bnOrZero } from '../bignumber'
import { zrxService } from '../zrxService'

export type GetAllowanceRequiredArgs = {
  receiveAddress: string
  allowanceContract: string
  sellAsset: Asset
  sellAmount: string
  web3: Web3
  erc20AllowanceAbi: AbiItem[]
}

export type GetERC20AllowanceArgs = {
  erc20AllowanceAbi: AbiItem[]
  web3: Web3
  tokenId: string
  ownerAddress: string
  spenderAddress: string
}

type GrantAllowanceArgs = {
  quote: TradeQuote<SupportedChainIds>
  wallet: HDWallet
  adapterManager: ChainAdapterManager
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
  return bnOrZero(amount).toNumber().toLocaleString('fullwide', { useGrouping: false })
}

export const getERC20Allowance = async ({
  erc20AllowanceAbi,
  web3,
  tokenId,
  ownerAddress,
  spenderAddress
}: GetERC20AllowanceArgs) => {
  const erc20Contract = new web3.eth.Contract(erc20AllowanceAbi, tokenId)
  return erc20Contract.methods.allowance(ownerAddress, spenderAddress).call()
}

export const getAllowanceRequired = async ({
  receiveAddress,
  allowanceContract,
  sellAsset,
  sellAmount,
  web3,
  erc20AllowanceAbi
}: GetAllowanceRequiredArgs): Promise<BigNumber> => {
  try {
    if (sellAsset.assetId === 'eip155:1/slip44:60') {
      return bn(0)
    }

    const ownerAddress = receiveAddress
    const spenderAddress = allowanceContract
    const tokenId = sellAsset.tokenId

    if (!tokenId) {
      throw new SwapError('[getAllowanceRequired] - sellAsset.tokenId is required', {
        code: SwapErrorTypes.ALLOWANCE_REQUIRED
      })
    }

    const allowanceOnChain = await getERC20Allowance({
      web3,
      erc20AllowanceAbi,
      ownerAddress,
      spenderAddress,
      tokenId
    })
    if (allowanceOnChain === '0') return bnOrZero(sellAmount)
    if (!allowanceOnChain) {
      throw new SwapError(
        `[getAllowanceRequired] - No allowance data for ${allowanceContract} to ${receiveAddress}`,
        { code: SwapErrorTypes.ALLOWANCE_REQUIRED }
      )
    }
    const allowanceRequired = bnOrZero(sellAmount).minus(allowanceOnChain)
    return allowanceRequired.lt(0) ? bn(0) : allowanceRequired
  } catch (e) {
    throw new SwapError('[getAllowanceRequired]', {
      cause: e,
      code: SwapErrorTypes.ALLOWANCE_REQUIRED
    })
  }
}

export const getUsdRate = async (input: Pick<Asset, 'symbol' | 'tokenId'>): Promise<string> => {
  const { symbol, tokenId } = input
  try {
    const USDC_CONTRACT_ADDRESS = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
    if (tokenId?.toLowerCase() === USDC_CONTRACT_ADDRESS) return '1' // Will break if comparing against usdc
    const rateResponse: AxiosResponse<ZrxPriceResponse> = await zrxService.get<ZrxPriceResponse>(
      '/swap/v1/price',
      {
        params: {
          buyToken: USDC_CONTRACT_ADDRESS,
          buyAmount: '1000000000', // rate is imprecise for low $ values, hence asking for $1000
          sellToken: tokenId || symbol
        }
      }
    )

    const price = bnOrZero(rateResponse.data.price)

    if (!price.gt(0))
      throw new SwapError('[getUsdRate] - Failed to get price data', {
        code: SwapErrorTypes.USD_RATE_FAILED
      })

    return bn(1).dividedBy(price).toString()
  } catch (e) {
    throw new SwapError('[getUsdRate]', {
      cause: e,
      code: SwapErrorTypes.USD_RATE_FAILED
    })
  }
}

export const grantAllowance = async ({
  quote,
  wallet,
  adapterManager,
  erc20Abi,
  web3
}: GrantAllowanceArgs): Promise<string> => {
  try {
    if (!quote.sellAsset.tokenId) {
      throw new SwapError('[grantAllowance] - sellAsset.tokenId is required', {
        code: SwapErrorTypes.GRANT_ALLOWANCE
      })
    }

    const adapter = await adapterManager.byChainId('eip155:1')
    const erc20Contract = new web3.eth.Contract(erc20Abi, quote.sellAsset.tokenId)
    const approveTx = erc20Contract.methods
      .approve(quote.allowanceContract, quote.sellAmount)
      .encodeABI()

    const accountNumber = bnOrZero(quote.sellAssetAccountId).toNumber()
    const bip44Params = adapter.buildBIP44Params({ accountNumber })

    const { txToSign } = await adapter.buildSendTransaction({
      wallet,
      to: quote.sellAsset.tokenId,
      bip44Params,
      value: '0',
      chainSpecific: {
        erc20ContractAddress: quote.sellAsset.tokenId,
        gasPrice: numberToHex(quote.feeData?.chainSpecific?.gasPrice || 0),
        gasLimit: numberToHex(quote.feeData?.chainSpecific?.estimatedGas || 0)
      }
    })

    const grantAllowanceTxToSign = {
      ...txToSign,
      data: approveTx
    }
    if (wallet.supportsOfflineSigning()) {
      const signedTx = await adapter.signTransaction({ txToSign: grantAllowanceTxToSign, wallet })

      if (!signedTx) {
        throw new SwapError(`[grantAllowance] - Signed transaction is required: ${signedTx}`, {
          code: SwapErrorTypes.GRANT_ALLOWANCE
        })
      }

      const broadcastedTxId = await adapter.broadcastTransaction(signedTx)

      return broadcastedTxId
    } else if (wallet.supportsBroadcast() && adapter.signAndBroadcastTransaction) {
      const broadcastedTxId = await adapter.signAndBroadcastTransaction?.({
        txToSign: grantAllowanceTxToSign,
        wallet
      })

      return broadcastedTxId
    } else {
      throw new SwapError('[grantAllowance] - invalid HDWallet config', {
        code: SwapErrorTypes.GRANT_ALLOWANCE
      })
    }
  } catch (e) {
    throw new SwapError('[grantAllowance]', {
      cause: e,
      code: SwapErrorTypes.GRANT_ALLOWANCE
    })
  }
}
