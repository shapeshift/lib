import { AssetId } from '@shapeshiftoss/caip'
import { HDWallet } from '@shapeshiftoss/hdwallet-core'
import {
  Asset,
  SupportedChainIds,
  SwapperType
} from '@shapeshiftoss/types'
import { ChainAdapterManager } from '@shapeshiftoss/chain-adapters'

import {
  BuyAssetBySellIdInput, CommonTradeInput, Swapper, Trade, ApprovalNeededOutput,
  GetMinMaxInput,
  MinMaxOutput,
  TradeResult,
} from '../../api'
import { getRateInfo } from './utils/helpers'
import { DEFAULT_SOURCE } from './utils/constants'

export type OsmoSwapperDeps = {
  wallet: HDWallet
  adapterManager: ChainAdapterManager
}

export class OsmosisSwapper implements Swapper {
  supportAssets: string[]
  deps: OsmoSwapperDeps

  getType() {
    return SwapperType.Osmosis
  }

  constructor(deps: OsmoSwapperDeps) {
    this.deps = deps
    this.supportAssets = ['cosmos:cosmoshub-4/slip44:118', 'cosmos:osmosis-1/slip44:118']
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async initialize() { }

  getUsdRate(input: Pick<Asset, 'symbol' | 'assetId'>): Promise<string> {
    console.info(input)
    return Promise.resolve('1')
  }

  getMinMax(input: GetMinMaxInput): Promise<MinMaxOutput> {
    console.info(input)
    return Promise.resolve({ // TODO: fix
      minimum: '0',
      maximum: '1000'
    })
  }

  async approvalNeeded(): Promise<ApprovalNeededOutput> {
    return { approvalNeeded: false }
  }

  async approveInfinite(): Promise<string> {
    throw new Error('OsmosisSwapper: approveInfinite unimplemented')
  }

  filterBuyAssetsBySellAssetId(args: BuyAssetBySellIdInput): any[] {
    const { sellAssetId } = args
    if (!this.supportAssets.includes(sellAssetId)) return []
    return this.supportAssets
  }

  filterAssetIdsBySellable(): AssetId[] {
    return this.supportAssets
  }

  async buildTrade(): Promise<Trade<SupportedChainIds>> {
    throw new Error('OsmosisSwapper: buildTrade unimplemented')
  }

  async getTradeQuote(input: CommonTradeInput): Promise<any> {
    const { sellAsset, buyAsset, sellAmount } = input

    if (!sellAmount) {
      throw new Error('sellAmount is required')
    }

    const { rate, buyAmount } = await getRateInfo(
      sellAsset,
      buyAsset,
      sellAmount !== '0' ? sellAmount : '1'
    )
    // console.log('******: ', { rate, priceImpact, tradeFee, buyAmount })

    return {
      buyAsset,
      feeData: { fee: '100' },
      maximum: '100',
      minimum: '10000',
      sellAssetAccountId: '0',
      rate,
      sellAsset,
      success: true,
      sellAmount,
      buyAmount,
      sources: DEFAULT_SOURCE
    }
  }

  async executeTrade(): Promise<TradeResult> {
    throw new Error('OsmosisSwapper: executeTrade unimplemented')
  }
}
