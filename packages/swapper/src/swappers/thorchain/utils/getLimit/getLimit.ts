import { Asset } from '@shapeshiftoss/asset-service'
import { adapters } from '@shapeshiftoss/caip'
import max from 'lodash/max'

import { SwapError, SwapErrorTypes } from '../../../../api'
import { bn, bnOrZero, fromBaseUnit, toBaseUnit } from '../../../utils/bignumber'
import { InboundResponse, ThorchainSwapperDeps } from '../../types'
import { THORCHAIN_FIXED_PRECISION } from '../constants'
import { getTradeRate } from '../getTradeRate/getTradeRate'
import { getUsdRate } from '../getUsdRate/getUsdRate'
import { isRune } from '../isRune/isRune'
import { thorService } from '../thorService'

export type GetLimitArgs = {
  buyAssetId: string
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
  const sellAssetChainFeeAsset = deps.adapterManager.get(sellAsset.chainId)?.getFeeAssetId()
  if (!sellAssetChainFeeAsset) {
    throw new SwapError('[getLimit]: no sellAssetChainFeeAsset for buy asset', {
      code: SwapErrorTypes.BUILD_TRADE_FAILED,
      details: { sellAssetChainFeeAsset, buyAssetId },
    })
  }

  const sellAssetChainFeeAssetRate = await getUsdRate({
    deps,
    input: { assetId: sellAssetChainFeeAsset },
  })
  const buyAssetUsdRate = await getUsdRate({ deps, input: { assetId: buyAssetId } })
  const expectedBuyAmountCryptoPrecision8 = toBaseUnit(
    fromBaseUnit(bnOrZero(sellAmountCryptoPrecision).times(tradeRate), sellAsset.precision),
    THORCHAIN_FIXED_PRECISION,
  )

  const isValidSlippageRange =
    bnOrZero(slippageTolerance).gte(0) && bnOrZero(slippageTolerance).lte(1)
  if (bnOrZero(expectedBuyAmountCryptoPrecision8).lt(0) || !isValidSlippageRange)
    throw new SwapError('[getLimit]: bad expected buy amount or bad slippage tolerance', {
      code: SwapErrorTypes.BUILD_TRADE_FAILED,
      details: { expectedBuyAmountCryptoPrecision8, slippageTolerance },
    })

  // FIXME: is this really just  buyAssetAddressData?.outbound_fee? Confirm once THORChain back online
  const buyAssetTradeFeeCryptoPrecision8 = toBaseUnit(
    bnOrZero(buyAssetTradeFeeUsd).div(buyAssetUsdRate),
    THORCHAIN_FIXED_PRECISION,
  )

  const { data: inboundAddresses } = await thorService.get<InboundResponse[]>(
    `${deps.daemonUrl}/lcd/thorchain/inbound_addresses`,
  )

  const sellAssetPoolId = adapters.assetIdToPoolAssetId({ assetId: sellAsset.assetId })
  const sellAssetChainSymbol = sellAssetPoolId?.slice(0, sellAssetPoolId.indexOf('.'))
  const sellAssetAddressData = inboundAddresses.find(
    (inbound) => inbound.chain === sellAssetChainSymbol,
  )

  const refundFeeCryptoPrecision8 = (() => {
    switch (true) {
      // If the sell asset is on THOR the return fee is fixed at 0.02 RUNE
      case isRune(sellAsset.assetId):
        return '2000000'
      // Else the return fee is the outbound fee of the sell asset's chain
      default:
        return bnOrZero(sellAssetAddressData?.outbound_fee)
          .times(sellAssetChainFeeAssetRate)
          .div(bn(buyAssetUsdRate) ?? bn(1))
          .toString()
    }
  })()

  const highestPossibleFeeCryptoPrecision8 = max([
    buyAssetTradeFeeCryptoPrecision8,
    refundFeeCryptoPrecision8,
  ])

  return bnOrZero(expectedBuyAmountCryptoPrecision8)
    .times(bn(1).minus(slippageTolerance))
    .minus(bnOrZero(highestPossibleFeeCryptoPrecision8))
    .decimalPlaces(0)
    .toString()
}
