import { Asset } from '@shapeshiftoss/asset-service'

import { SwapError, SwapErrorTypes } from '../../../../api'
import { bn, bnOrZero, fromBaseUnit, toBaseUnit } from '../../../utils/bignumber'
import { ThorchainSwapperDeps } from '../../types'
import { THORCHAIN_FIXED_PRECISION } from '../constants'
import { getTradeRate } from '../getTradeRate/getTradeRate'
import { getUsdRate } from '../getUsdRate/getUsdRate'

export type GetLimitArgs = {
  buyAssetId: string
  destinationAddress: string
  sellAsset: Asset
  sellAmountCryptoPrecision: string
  deps: ThorchainSwapperDeps
  slippageTolerance: string
  buyAssetTradeFeeUsd: string
}

export const getLimit = async ({
  sellAsset,
  buyAssetId,
  sellAmountCryptoPrecision,
  deps,
  slippageTolerance,
  buyAssetTradeFeeUsd,
}: GetLimitArgs): Promise<string> => {
  const tradeRate = await getTradeRate(sellAsset, buyAssetId, sellAmountCryptoPrecision, deps)
  const buyAssetUsdRate = await getUsdRate({ deps, input: { assetId: buyAssetId } })
  const expectedBuyAmountCryptoPrecision8 = toBaseUnit(
    fromBaseUnit(bnOrZero(sellAmountCryptoPrecision).times(tradeRate), sellAsset.precision),
    THORCHAIN_FIXED_PRECISION,
  )

  const isValidSlippageRange =
    bnOrZero(slippageTolerance).gte(0) && bnOrZero(slippageTolerance).lte(1)
  if (bnOrZero(expectedBuyAmountCryptoPrecision8).lt(0) || !isValidSlippageRange)
    throw new SwapError('[getThorTxInfo]: bad expected buy amount or bad slippage tolerance', {
      code: SwapErrorTypes.BUILD_TRADE_FAILED,
      details: { expectedBuyAmountCryptoPrecision8, slippageTolerance },
    })

  const buyAssetTradeFeeCryptoPrecision8 = toBaseUnit(
    bnOrZero(buyAssetTradeFeeUsd).div(buyAssetUsdRate),
    THORCHAIN_FIXED_PRECISION,
  )

  return bnOrZero(expectedBuyAmountCryptoPrecision8)
    .times(bn(1).minus(slippageTolerance))
    .minus(bnOrZero(buyAssetTradeFeeCryptoPrecision8))
    .decimalPlaces(0)
    .toString()
}
