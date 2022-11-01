import { Asset } from '@shapeshiftoss/asset-service'
import { adapters, thorchainAssetId } from '@shapeshiftoss/caip'
import max from 'lodash/max'

import { SwapError, SwapErrorTypes } from '../../../../api'
import { bn, bnOrZero, fromBaseUnit, toBaseUnit } from '../../../utils/bignumber'
import { RUNE_OUTBOUND_TRANSACTION_FEE_CRYPTO_HUMAN } from '../../constants'
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
  console.log('xxx getLimit args', {
    sellAsset,
    buyAssetId,
    sellAmountCryptoPrecision,
    deps,
    slippageTolerance,
    buyAssetTradeFeeUsd,
  })
  const tradeRate = await getTradeRate(sellAsset, buyAssetId, sellAmountCryptoPrecision, deps)
  const sellAssetChainFeeAssetId = deps.adapterManager.get(sellAsset.chainId)?.getFeeAssetId()
  if (!sellAssetChainFeeAssetId) {
    throw new SwapError('[getLimit]: no sellAssetChainFeeAsset for buy asset', {
      code: SwapErrorTypes.BUILD_TRADE_FAILED,
      details: { sellAssetChainFeeAssetId, buyAssetId },
    })
  }

  const sellFeeAssetUsdRate = await getUsdRate({
    deps,
    input: { assetId: sellAssetChainFeeAssetId },
  })
  const buyAssetUsdRate = await getUsdRate({ deps, input: { assetId: buyAssetId } })
  const runeAssetUsdRate = await getUsdRate({ deps, input: { assetId: thorchainAssetId } })
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

  // FIXME: is this really just buyAssetAddressData?.outbound_fee? Confirm once THORChain back online
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

  // fixme: for logging only
  const buyAssetPoolId = adapters.assetIdToPoolAssetId({ assetId: buyAssetId })
  const buyAssetChainSymbol = buyAssetPoolId?.slice(0, buyAssetPoolId.indexOf('.'))
  const buyAssetAddressData = inboundAddresses.find(
    (inbound) => inbound.chain === buyAssetChainSymbol,
  )

  // We want this in the buy asset crypto precision
  const refundFeeBuyAssetCryptoPrecision8 = (() => {
    switch (true) {
      // If the sell asset is on THOR the return fee is fixed at 0.02 RUNE
      case isRune(sellAsset.assetId): {
        const runeFeeUsd = RUNE_OUTBOUND_TRANSACTION_FEE_CRYPTO_HUMAN.times(runeAssetUsdRate)
        return toBaseUnit(bnOrZero(runeFeeUsd).div(buyAssetUsdRate), THORCHAIN_FIXED_PRECISION)
      }
      // Else the return fee is the outbound fee of the sell asset's chain
      default: {
        const sellAssetTradeFeeCryptoHuman = fromBaseUnit(
          bnOrZero(sellAssetAddressData?.outbound_fee),
          THORCHAIN_FIXED_PRECISION,
        )
        const sellAssetTradeFeeUsd = bnOrZero(sellAssetTradeFeeCryptoHuman).times(
          sellFeeAssetUsdRate,
        )
        return toBaseUnit(
          bnOrZero(sellAssetTradeFeeUsd).div(buyAssetUsdRate),
          THORCHAIN_FIXED_PRECISION,
        )
      }
    }
  })()

  const highestPossibleFeeCryptoPrecision8 = max([
    buyAssetTradeFeeCryptoPrecision8,
    refundFeeBuyAssetCryptoPrecision8,
  ])

  return bnOrZero(expectedBuyAmountCryptoPrecision8)
    .times(bn(1).minus(slippageTolerance))
    .minus(bnOrZero(highestPossibleFeeCryptoPrecision8))
    .decimalPlaces(0)
    .toString()
}
