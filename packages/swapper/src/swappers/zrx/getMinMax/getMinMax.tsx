import { ChainTypes, GetQuoteInput, QuoteResponse,MinMaxOutput } from '@shapeshiftoss/types'
import BigNumber from 'bignumber.js'
import { MAX_ZRX_TRADE } from '../utils/constants'
import { getUsdRate, normalizeAmount } from '../utils/helpers/helpers'
import { zrxService } from '../utils/zrxService'
import { ZrxError } from '../ZrxSwapper'

export const getMinMax = async (input: GetQuoteInput): Promise<MinMaxOutput> => {
  const { sellAsset, buyAsset, sellAmount } = input
  if (!sellAmount) {
    throw new ZrxError('sellAmount required')
  }

  if (sellAsset.chain !== ChainTypes.Ethereum || buyAsset.chain !== ChainTypes.Ethereum) {
    throw new ZrxError('must be eth assets')
  }

  const buyToken = buyAsset.tokenId || buyAsset.symbol || buyAsset.chain
  const sellToken = sellAsset.tokenId || sellAsset.symbol || sellAsset.chain
  if (!buyToken) {
    throw new ZrxError(
      'ZrxSwapper:getQuote: One of buyAssetContract or buyAssetSymbol or buyAssetNetwork are required'
    )
  }
  if (!sellToken) {
    throw new ZrxError(
      'ZrxSwapper:getQuote: One of sellAssetContract or sellAssetSymbol or sellAssetNetwork are required'
    )
  }

  const usdRate = await getUsdRate({
    symbol: sellAsset.symbol,
    tokenId: sellAsset.tokenId
  })

  const minimumWeiAmount = new BigNumber(1)
    .dividedBy(new BigNumber(usdRate))
    .times(new BigNumber(10).exponentiatedBy(sellAsset.precision))

  const minimum = new BigNumber(1).dividedBy(new BigNumber(usdRate)).toString()

  const minimumPriceResult = await zrxService.get<QuoteResponse>('/swap/v1/price', {
    params: {
      sellToken,
      buyToken,
      sellAmount: normalizeAmount(minimumWeiAmount.toString())
    }
  })

  const minimumPrice = new BigNumber(minimumPriceResult?.data?.price).toString()

  return {
    minimum,
    minimumPrice,
    maximum: MAX_ZRX_TRADE
  }
}
