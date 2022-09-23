import { Asset } from '@shapeshiftoss/asset-service'
import { HDWallet } from '@shapeshiftoss/hdwallet-core'
import { KnownChainIds } from '@shapeshiftoss/types'

import { BuildTradeInput, GetTradeQuoteInput, TradeQuote } from '../../../api'
import { FOX, WETH } from './assets'

export const setupQuote = () => {
  const sellAsset: Asset = { ...FOX }
  const buyAsset: Asset = { ...WETH }
  const tradeQuote: TradeQuote<KnownChainIds.EthereumMainnet> = {
    buyAmount: '',
    sellAmount: '1000000000000000000',
    sellAsset,
    buyAsset,
    allowanceContract: 'allowanceContractAddress',
    sellAssetBip44Params: { purpose: 44, coinType: 60, accountNumber: 0 },
    minimum: '0',
    maximum: '999999999999',
    feeData: { fee: '0', tradeFee: '0', chainSpecific: {} },
    rate: '1',
    sources: [],
  }

  const quoteInput: GetTradeQuoteInput = {
    bip44Params: {
      accountNumber: 0,
      coinType: 60,
      purpose: 44,
    },
    chainId: KnownChainIds.EthereumMainnet,
    sellAmount: '1000000000000000000',
    sellAsset,
    buyAsset,
    sellAssetBip44Params: { purpose: 44, coinType: 60, accountNumber: 0 },
    sendMax: false,
    receiveAddress: '0xc770eefad204b5180df6a14ee197d99d808ee52d',
  }
  return { quoteInput, tradeQuote, buyAsset, sellAsset }
}

export const setupBuildTrade = () => {
  const sellAsset: Asset = { ...FOX }
  const buyAsset: Asset = { ...WETH }
  const buildTradeInput: BuildTradeInput = {
    bip44Params: {
      accountNumber: 0,
      coinType: 60,
      purpose: 44,
    },
    chainId: KnownChainIds.EthereumMainnet,
    sellAmount: '1000000000000000000',
    buyAsset,
    sendMax: false,
    sellAssetBip44Params: { purpose: 44, coinType: 60, accountNumber: 0 },
    sellAsset,
    wallet: <HDWallet>{},
    receiveAddress: '',
  }
  return { buildTradeInput, buyAsset, sellAsset }
}
