import { AssetId, poolAssetIdToAssetId } from '@shapeshiftoss/caip'
import { Asset, SupportedChainIds } from '@shapeshiftoss/types'
import axios from 'axios'

import {
  ApprovalNeededOutput,
  GetMinMaxInput,
  MinMaxOutput,
  Swapper,
  SwapperType,
  Trade,
  TradeQuote,
  TradeResult,
  TradeTxs
} from '../../api'
import { MidguardResponse } from './types'

export type ThorchainSwapperDeps = {
  midgardUrl: string
}

export class ThorchainSwapper implements Swapper {
  public supportedAssetIds: AssetId[]
  deps: ThorchainSwapperDeps

  constructor(deps: ThorchainSwapperDeps) {
    this.deps = deps
  }

  async initialize() {
    const { data: responseData } = await axios.get<MidguardResponse[]>(this.deps.midgardUrl)
    this.supportedAssetIds = responseData
      .map((midgardPool) => poolAssetIdToAssetId(midgardPool.asset))
      .filter((assetId) => assetId) // remove any undefined values that may come back from `poolAssetIdToAssetId`
  }

  getType() {
    return SwapperType.Thorchain
  }

  getUsdRate(input: Pick<Asset, 'symbol' | 'assetId'>): Promise<string> {
    console.info(input)
    throw new Error('ThorchainSwapper: getUsdRate unimplemented')
  }

  getMinMax(input: GetMinMaxInput): Promise<MinMaxOutput> {
    console.info(input)
    throw new Error('ThorchainSwapper: getMinMax unimplemented')
  }

  async approvalNeeded(): Promise<ApprovalNeededOutput> {
    throw new Error('ThorchainSwapper: approvalNeeded unimplemented')
  }

  async approveInfinite(): Promise<string> {
    throw new Error('ThorchainSwapper: approveInfinite unimplemented')
  }

  filterBuyAssetsBySellAssetId(): AssetId[] {
    return []
  }

  filterAssetIdsBySellable(): AssetId[] {
    return []
  }

  async buildTrade(): Promise<Trade<SupportedChainIds>> {
    throw new Error('ThorchainSwapper: buildTrade unimplemented')
  }

  async getTradeQuote(): Promise<TradeQuote<SupportedChainIds>> {
    throw new Error('ThorchainSwapper: getTradeQuote unimplemented')
  }

  async executeTrade(): Promise<TradeResult> {
    throw new Error('ThorchainSwapper: executeTrade unimplemented')
  }

  async getTradeTxs(): Promise<TradeTxs> {
    throw new Error('ThorchainSwapper: executeTrade unimplemented')
  }
}
