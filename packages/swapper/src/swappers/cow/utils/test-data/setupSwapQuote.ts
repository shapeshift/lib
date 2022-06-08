import { Asset } from '@shapeshiftoss/types'

import { TradeQuote } from '../../../../api'
import { FOX, WETH } from '../../../utils/test-data/assets'

export const setupQuote = () => {
  const sellAsset: Asset = { ...FOX }
  const buyAsset: Asset = { ...WETH }
  const tradeQuote: TradeQuote<'eip155:1'> = {
    buyAmount: '',
    sellAmount: '1000000000000000000',
    sellAsset,
    buyAsset,
    allowanceContract: 'allowanceContractAddress',
    sellAssetAccountId: '0',
    minimum: '0',
    maximum: '999999999999',
    feeData: { fee: '0', tradeFee: '0', chainSpecific: {} },
    rate: '1',
    sources: []
  }

  return { tradeQuote, sellAsset }
}
