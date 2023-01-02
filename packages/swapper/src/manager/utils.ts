import { Asset } from '@shapeshiftoss/asset-service'
import { ChainId } from '@shapeshiftoss/caip'

import { Swapper, TradeQuote } from '../api'
import { bnOrZero, fromBaseUnit } from '../swappers/utils/bignumber'

export const getRatioFromQuote = async (
  quote: TradeQuote<ChainId>,
  swapper: Swapper<ChainId>,
  feeAsset: Asset,
): Promise<number> => {
  // There is an assumption here that swappers generally return comparable asset rates
  // If a swapper were to undervalue the outbound asset and overvalue the inbound asset
  // then the ratio would be incorrectly in its favour
  const sellAssetUsdRate = await swapper.getUsdRate(quote.sellAsset)
  const buyAssetUsdRate = await swapper.getUsdRate(quote.buyAsset)
  const feeAssetUsdRate = await swapper.getUsdRate(feeAsset)

  const totalSellAmountFiat = bnOrZero(
    fromBaseUnit(quote.sellAmountBeforeFeesCryptoBaseUnit, quote.sellAsset.precision),
  )
    .times(sellAssetUsdRate)
    .plus(bnOrZero(quote.feeData.sellAssetTradeFeeUsd))

  const totalReceiveAmountFiat = bnOrZero(
    fromBaseUnit(quote.buyAmountCryptoBaseUnit, quote.buyAsset.precision),
  )
    .times(buyAssetUsdRate)
    .plus(bnOrZero(quote.feeData.buyAssetTradeFeeUsd))
  const networkFeeFiat = bnOrZero(
    fromBaseUnit(quote.feeData.networkFeeCryptoBaseUnit, feeAsset.precision),
  ).times(feeAssetUsdRate)

  return totalReceiveAmountFiat.div(totalSellAmountFiat.plus(networkFeeFiat)).toNumber()
}
