import { Asset } from '@shapeshiftoss/asset-service'
import { HDWallet } from '@shapeshiftoss/hdwallet-core'
import { BIP44Params, KnownChainIds } from '@shapeshiftoss/types'

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
    minimum: '0',
    maximum: '999999999999',
    feeData: { fee: '0', tradeFee: '0', chainSpecific: {} },
    rate: '1',
    sources: [],
    receiveAddress: '0xc770eefad204b5180df6a14ee197d99d808ee52d'
  }

  const bip44Params: BIP44Params = { purpose: 44, coinType: 60, accountNumber: 0 }
  const quoteInput: GetTradeQuoteInput = {
    chainId: KnownChainIds.EthereumMainnet,
    sellAmount: '1000000000000000000',
    sellAsset,
    buyAsset,
    sendMax: false,
    receiveAddress: '0xc770eefad204b5180df6a14ee197d99d808ee52d',
    wallet: {} as HDWallet,
    bip44Params
  }
  return { quoteInput, tradeQuote, buyAsset, sellAsset }
}

export const setupBuildTrade = () => {
  const sellAsset: Asset = { ...FOX }
  const buyAsset: Asset = { ...WETH }
  const bip44Params: BIP44Params = { purpose: 44, coinType: 60, accountNumber: 0 }
  const buildTradeInput: BuildTradeInput = {
    chainId: KnownChainIds.EthereumMainnet,
    sellAmount: '1000000000000000000',
    buyAsset,
    sendMax: false,
    sellAsset,
    wallet: <HDWallet>{},
    receiveAddress: '',
    bip44Params
  }
  return { buildTradeInput, buyAsset, sellAsset }
}
