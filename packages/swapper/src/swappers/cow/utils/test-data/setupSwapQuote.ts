import { Asset, SupportedChainIds } from '@shapeshiftoss/types'

import { TradeQuote } from '../../../../api'
import { FOX, WETH } from '../../../utils/test-data/assets'

export const setupQuote = () => {
  const sellAsset: Asset = { ...FOX }
  const buyAsset: Asset = { ...WETH }
  const tradeQuote: TradeQuote<SupportedChainIds> = {
    success: true,
    statusReason: '',
    buyAmount: '',
    sellAmount: '1000000000000000000',
    sellAsset,
    buyAsset,
    allowanceContract: 'allowanceContractAddress',
    sellAssetAccountId: '0',
    minimum: '0',
    maximum: '999999999999',
    feeData: { fee: '0' },
    rate: '1',
    sources: []
  }

  return { tradeQuote, sellAsset }
}
