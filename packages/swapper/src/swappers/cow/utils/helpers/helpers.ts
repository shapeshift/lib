import { fromAssetId } from '@shapeshiftoss/caip'
import { Asset } from '@shapeshiftoss/types'
import { AxiosResponse } from 'axios'

import { SwapError, SwapErrorTypes } from '../../../../api'
import { bn, bnOrZero } from '../../../utils/bignumber'
import { CowSwapperDeps } from '../../CowSwapper'
import { CowSwapPriceResponse } from '../../types'
import { ETH_ASSET_ID, WETH_ASSET_ID } from '../constants'
import { cowService } from '../cowService'
import { ethers } from "ethers"
import { TypedDataDomain } from '@ethersproject/abstract-signer'

const USDC_CONTRACT_ADDRESS = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
const USDC_ASSET_PRECISION = 6

const ORDER_TYPE_FIELDS = [
  { name: 'sellToken', type: 'address' },
  { name: 'buyToken', type: 'address' },
  { name: 'receiver', type: 'address' },
  { name: 'sellAmount', type: 'uint256' },
  { name: 'buyAmount', type: 'uint256' },
  { name: 'validTo', type: 'uint32' },
  { name: 'appData', type: 'bytes32' },
  { name: 'feeAmount', type: 'uint256' },
  { name: 'kind', type: 'string' },
  { name: 'partiallyFillable', type: 'bool' },
  { name: 'sellTokenBalance', type: 'string' },
  { name: 'buyTokenBalance', type: 'string' },
]

/**
 * EIP-712 typed data type definitions.
 */
export declare type TypedDataTypes = Parameters<typeof ethers.utils._TypedDataEncoder.hashStruct>[1];

export type CowSwapOrder = {
  sellToken: string
  buyToken: string
  receiver: string
  sellAmount: string
  buyAmount: string
  validTo: number
  appData: string
  feeAmount: string
  kind: string
  partiallyFillable: boolean
  sellTokenBalance: string
  buyTokenBalance: string
}

export const getUsdRate = async (
  { apiUrl, assetService }: CowSwapperDeps,
  input: Asset
): Promise<string> => {
  // Replacing ETH by WETH specifically for CowSwap in order to get an usd rate when called with ETH as feeAsset
  const asset = input.assetId !== ETH_ASSET_ID ? input : assetService.getAll()[WETH_ASSET_ID]
  const { assetReference: erc20Address, assetNamespace } = fromAssetId(asset.assetId)

  if (assetNamespace !== 'erc20') {
    throw new SwapError('[getUsdRate] - unsupported asset namespace', {
      code: SwapErrorTypes.USD_RATE_FAILED,
      details: { assetNamespace }
    })
  }

  const buyAmountInDollars = 1000
  const buyAmount = bn(buyAmountInDollars).times(bn(10).exponentiatedBy(USDC_ASSET_PRECISION))

  try {
    // rate is imprecise for low $ values, hence asking for $1000
    // cowSwap api used : markets/{baseToken}-{quoteToken}/{kind}/{amount}
    // It returns the estimated amount in quoteToken for either buying or selling amount of baseToken.
    const rateResponse: AxiosResponse<CowSwapPriceResponse> =
      await cowService.get<CowSwapPriceResponse>(
        `${apiUrl}/v1/markets/${USDC_CONTRACT_ADDRESS}-${erc20Address}/buy/${buyAmount}`
      )

    const tokenAmount = bnOrZero(rateResponse.data.amount).div(
      bn(10).exponentiatedBy(asset.precision)
    )

    if (!tokenAmount.gt(0))
      throw new SwapError('[getUsdRate] - Failed to get token amount', {
        code: SwapErrorTypes.RESPONSE_ERROR
      })

    // dividing $1000 by amount of token received
    return bn(buyAmountInDollars).dividedBy(tokenAmount).toString()
  } catch (e) {
    if (e instanceof SwapError) throw e
    throw new SwapError('[getUsdRate]', {
      cause: e,
      code: SwapErrorTypes.USD_RATE_FAILED
    })
  }
}

export const getNowPlusThirtyMinutesTimestamp = (): number => {
  const millisecondsPerMinute = 60000

  // UTC date + 30 minutes
  const nowPlusThirtyMinutesDate = new Date(new Date().getTime() + 30 * millisecondsPerMinute)

  // returning the timestamp in seconds
  return Math.round(nowPlusThirtyMinutesDate.getTime() / 1000)
}

export const hashTypedData = (
  domain: TypedDataDomain,
  types: TypedDataTypes,
  data: Record<string, unknown>,
): string => {
  return ethers.utils._TypedDataEncoder.hash(domain, types, data)
}

/**
 * Compute the 32-byte signing hash for the specified order.
 *
 * @param domain The EIP-712 domain separator to compute the hash for.
 * @param order The order to compute the digest for.
 * @return Hex-encoded 32-byte order digest.
 */
export const hashOrder = (domain: TypedDataDomain, order: CowSwapOrder): string => {
  return hashTypedData(
    domain,
    { Order: ORDER_TYPE_FIELDS },
    order,
  )
}

export const domain = (chainId: number, verifyingContract: string): TypedDataDomain => {
  return {
      name: "Gnosis Protocol",
      version: "v2",
      chainId,
      verifyingContract,
  };
}
