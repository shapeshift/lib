import { avalanche, ethereum } from '@shapeshiftoss/chain-adapters'
import type Web3 from 'web3'

import { EvmSupportedChainIds, SwapSource, Trade } from '../../api'

export type ZrxCommonResponse = {
  price: string
  gasPrice: string
  buyAmount: string
  sellAmount: string
  allowanceTarget: string
  sources: Array<SwapSource>
}

export type ZrxPriceResponse = ZrxCommonResponse & {
  estimatedGas: string
}

export type ZrxQuoteResponse = ZrxCommonResponse & {
  to: string
  data: string
  gas: string
}

export interface ZrxTrade extends Trade<EvmSupportedChainIds> {
  txData: string
  depositAddress: string
}

export type ZrxSwapperDeps = {
  adapter: ethereum.ChainAdapter | avalanche.ChainAdapter
  web3: Web3
}
