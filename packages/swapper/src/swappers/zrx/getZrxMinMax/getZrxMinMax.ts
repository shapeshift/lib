import { caip19, WellKnownChain } from '@shapeshiftoss/caip'
import { GetQuoteInput, MinMaxOutput, QuoteResponse } from '@shapeshiftoss/types'
import BigNumber from 'bignumber.js'

import { MAX_ZRX_TRADE } from '../utils/constants'
import { getUsdRate, getZrxToken, normalizeAmount } from '../utils/helpers/helpers'
import { zrxService } from '../utils/zrxService'
import { ZrxError } from '../ZrxSwapper'

export const getZrxMinMax = async (
  input: Pick<GetQuoteInput, 'sellAsset' | 'buyAsset'>
): Promise<MinMaxOutput> => {
  const { sellAsset, buyAsset } = input

  if (
    caip19.fromCAIP19(sellAsset.assetId).chainId !== WellKnownChain.EthereumMainnet ||
    caip19.fromCAIP19(buyAsset.assetId).chainId !== WellKnownChain.EthereumMainnet
  ) {
    throw new ZrxError('getZrxMinMax - must be eth assets')
  }

  const usdRate = await getUsdRate(sellAsset)

  const minimumWeiAmount = new BigNumber(1)
    .dividedBy(new BigNumber(usdRate))
    .times(new BigNumber(10).exponentiatedBy(sellAsset.precision))

  const minimum = new BigNumber(1).dividedBy(new BigNumber(usdRate)).toString()
  const minimumPriceResult = await zrxService.get<QuoteResponse>('/swap/v1/price', {
    params: {
      sellToken: getZrxToken(sellAsset),
      buyToken: getZrxToken(buyAsset),
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
