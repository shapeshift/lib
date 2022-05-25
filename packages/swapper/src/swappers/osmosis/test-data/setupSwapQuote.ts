// import { Asset } from '@shapeshiftoss/types/*'

import { DEFAULT_SLIPPAGE } from '../constants'
import { OSMO, ATOM } from './assets'

export const setupQuote = () => {
  const sellAsset: any = { ...OSMO }
  const buyAsset: any = { ...ATOM }

  const quoteInput = {
    sellAsset,
    buyAsset,
    success: true,
    sellAmount: '1000000000000000000',
    slippage: DEFAULT_SLIPPAGE,
    allowanceContract: 'allowanceContractAddress',
    allowanceTarget: 'allowanceTargetAddress',
    receiveAddress: 'receiveAddress',
    sellAssetAccountId: '0',
    buyAssetAccountId: '0'
  }
  return { quoteInput, buyAsset, sellAsset }
}
