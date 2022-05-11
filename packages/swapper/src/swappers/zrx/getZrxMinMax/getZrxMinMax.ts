import { GetQuoteInput, MinMaxOutput } from '@shapeshiftoss/types'

import { bnOrZero } from '../utils/bignumber'
import { MAX_ZRX_TRADE } from '../utils/constants'
import { getUsdRate } from '../utils/helpers/helpers'

export const getZrxMinMax = async (
  input: Pick<GetQuoteInput, 'sellAsset' | 'buyAsset'>
): Promise<MinMaxOutput> => {
  const { sellAsset } = input

  if (sellAsset.chainId !== 'eip155:1' || buyAsset.chain !== 'eip155:1') {
    throw new ZrxError('getZrxMinMax - must be eth assets')
  }

  const usdRate = await getUsdRate({
    symbol: sellAsset.symbol,
    tokenId: sellAsset.tokenId
  })

  const minimum = bnOrZero(1).dividedBy(bnOrZero(usdRate)).toString()

  return {
    minimum, // $1 worth of the sell token.
    maximum: MAX_ZRX_TRADE // Arbitrarily large value. 10e+28 here.
  }
}
