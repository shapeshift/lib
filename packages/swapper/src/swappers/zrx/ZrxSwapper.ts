import Web3 from 'web3'
import { Asset, ChainTypes } from '@shapeshiftoss/asset-service'
import { ChainAdapterManager } from '@shapeshiftoss/chain-adapters'
import { BuildQuoteTxArgs, GetQuoteInput, Quote, Swapper, SwapperType } from '../../api'

import { buildQuoteTx } from './buildQuoteTx/buildQuoteTx'
import { getZrxQuote } from './getQuote/getQuote'
import { getDeps } from '../../utils/helpers/helpers'

export type ZrxSwapperDeps = {
  adapterManager: ChainAdapterManager
  web3: Web3 //TODO: (ryankk) make web3 optional dependency
  message?: string
}

export class ZrxSwapper implements Swapper {
  public static swapperName = 'ZrxSwapper'
  adapterManager: ChainAdapterManager
  web3: Web3
  message: string

  constructor(deps: ZrxSwapperDeps) {
    // TODO: (ryankk) add both dependencies as optional
    this.message = `ZrxError:${deps.message}`
    this.adapterManager = deps.adapterManager
    this.web3 = deps.web3
  }

  // TODO: (ryankk) finish implementing this for passing deps to functions
  private getDeps() {
    return getDeps.call(this)
  }

  getType() {
    return SwapperType.Zrx
  }

  async buildQuoteTx({ input, wallet }: BuildQuoteTxArgs): Promise<Quote> {
    return buildQuoteTx({ adapterManager: this.adapterManager, web3: this.web3 }, { input, wallet })
  }
  async getQuote(input: GetQuoteInput): Promise<Quote> {
    return getZrxQuote(input)
  }

  getAvailableAssets(assets: Asset[]): Asset[] {
    return assets.filter((asset) => asset.chain === ChainTypes.Ethereum)
  }

  canTradePair(sellAsset: Asset, buyAsset: Asset): boolean {
    const availableAssets = this.getAvailableAssets([sellAsset, buyAsset])
    return availableAssets.length === 2
  }
}
