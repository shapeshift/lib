import Web3 from 'web3'
import { ChainAdapterManager } from '@shapeshiftoss/chain-adapters'
import { Swapper, SwapperType, Quote, BuildQuoteTxArgs } from '../../api'

import { buildQuoteTx } from './buildQuoteTx/buildQuoteTx'
import { getDeps } from '../../utils/helpers/helpers'

export type ZrxSwapperDeps = {
  adapterManager: ChainAdapterManager
  web3: Web3 //TODO: (ryankk) make web3 optional dependency
}

export class ZrxSwapper implements Swapper {
  public static swapperName = 'ZrxSwapper'
  adapterManager: ChainAdapterManager
  web3: Web3

  constructor(deps: ZrxSwapperDeps) {
    this.adapterManager = deps.adapterManager
    // TODO: add default web3 instance
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
}
