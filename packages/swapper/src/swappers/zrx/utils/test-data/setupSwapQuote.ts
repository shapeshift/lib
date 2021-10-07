import { FOX, WETH } from './assets'
import { DEFAULT_SLIPPAGE } from '../constants'

export const setupQuote = () => {
  const sellAsset = { ...FOX }
  const buyAsset = { ...WETH }

  const quoteInput = {
    sellAsset,
    buyAsset,
    success: true,
    sellAmount: '1000000000000000000',
    slippage: DEFAULT_SLIPPAGE,
    allowanceContract: '0xDd4a7cc4092515C130667C1bFd53Be0DE91062C5',
    receiveAddress: '0x22d76bB60B70fF2F3aD698a753EC7E64aeB0426C',
    sellAssetAccountId: '0',
    buyAssetAccountId: '0'
  }
  return { quoteInput, buyAsset, sellAsset }
}
