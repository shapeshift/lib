import { Asset } from '@shapeshiftoss/types'

import { GetTradeQuoteInput, TradeQuote } from '../../../api'
import { FOX, WETH } from './assets'

export const setupQuote = () => {
  const sellAsset: Asset = { ...FOX }
  const buyAsset: Asset = { ...WETH }
  const tradeQuote: TradeQuote<'eip155:1'> = {
    buyAmount: '',
    sellAmount: '1000000000000000000',
    sellAsset,
    buyAsset,
    allowanceContract: 'allowanceContractAddress',
    sellAssetAccountNumber: 0,
    minimum: '0',
    maximum: '999999999999',
    feeData: { fee: '0', tradeFee: '0', chainSpecific: {} },
    rate: '1',
    sources: []
  }

  const quoteInput: GetTradeQuoteInput = {
    sellAmount: '1000000000000000000',
    sellAsset,
    buyAsset,
    sellAssetAccountNumber: 0,
    sendMax: false
  }
  return { quoteInput, tradeQuote, buyAsset, sellAsset }
}

export const setupBuildTrade = () => {
  const sellAsset: Asset = { ...FOX }
  const buyAsset: Asset = { ...WETH }
  const buildTradeInput = {
    sellAmount: '1000000000000000000',
    allowanceTarget: 'allowanceTargetAddress',
    price: '1',
    to: '0x123',
    buyAmount: '',
    buyAsset,
    sendMax: false,
    sellAssetAccountNumber: 0,
    buyAssetAccountNumber: 0,
    sellAsset
  }
  return { buildTradeInput, buyAsset, sellAsset }
}
