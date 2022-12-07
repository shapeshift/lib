import { Asset } from '@shapeshiftoss/asset-service'
import { ChainId } from '@shapeshiftoss/caip'

import { Swapper, TradeQuote } from '../api'
import { bnOrZero, fromBaseUnit } from '../swappers/utils/bignumber'

export const getRatioFromQuote = async (
  quote: TradeQuote<ChainId>,
  swapper: Swapper<ChainId>,
  feeAsset: Asset,
): Promise<number> => {
  const sellAssetUsdRate = await swapper.getUsdRate(quote.sellAsset)
  const buyAssetUsdRate = await swapper.getUsdRate(quote.buyAsset)
  const feeAssetUsdRate = await swapper.getUsdRate(feeAsset)

  const totalSellAmountFiat = bnOrZero(
    fromBaseUnit(quote.sellAmountCryptoPrecision, quote.sellAsset.precision),
  )
    .times(sellAssetUsdRate)
    .plus(bnOrZero(quote.feeData.sellAssetTradeFeeUsd))
  const totalReceiveAmountFiat = bnOrZero(
    fromBaseUnit(quote.buyAmountCryptoPrecision, quote.buyAsset.precision),
  )
    .times(buyAssetUsdRate)
    .plus(bnOrZero(quote.feeData.buyAssetTradeFeeUsd))
  const networkFeeFiat = bnOrZero(fromBaseUnit(quote.feeData.networkFee, feeAsset.precision)).times(
    feeAssetUsdRate,
  )
  return totalReceiveAmountFiat.div(totalSellAmountFiat.plus(networkFeeFiat)).toNumber()
}
