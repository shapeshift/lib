import { AssetId } from '@shapeshiftoss/caip'
import { ChainAdapterManager } from '@shapeshiftoss/chain-adapters'
import { Asset, SupportedChainIds } from '@shapeshiftoss/types'
import Web3 from 'web3'

import {
  ApprovalNeededInput,
  ApprovalNeededOutput,
  ApproveInfiniteInput,
  BuildTradeInput,
  BuyAssetBySellIdInput,
  ExecuteTradeInput,
  GetTradeQuoteInput,
  Swapper,
  SwapperType,
  Trade,
  TradeQuote,
  TradeResult,
  TradeTxs
} from '../../api'
import { CowApprovalNeeded } from './CowApprovalNeeded/CowApprovalNeeded'
import { CowApproveInfinite } from './CowApproveInfinite/CowApproveInfinite'
import { getUsdRate } from './utils/helpers/helpers'

export type CowSwapperDeps = {
  apiUrl: string
  adapterManager: ChainAdapterManager
  web3: Web3
}

export class CowSwapper implements Swapper {
  public static swapperName = 'CowSwapper'
  deps: CowSwapperDeps

  constructor(deps: CowSwapperDeps) {
    this.deps = deps
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async initialize() {}

  getType() {
    return SwapperType.CowSwap
  }

  async buildTrade(args: BuildTradeInput): Promise<Trade<SupportedChainIds>> {
    console.info(args)
    throw new Error('CowSwapper: buildTrade unimplemented')
  }

  async getTradeQuote(input: GetTradeQuoteInput): Promise<TradeQuote<SupportedChainIds>> {
    console.info(input)
    throw new Error('CowSwapper: getTradeQuote unimplemented')
  }

  async getUsdRate(input: Asset): Promise<string> {
    return getUsdRate(this.deps, input)
  }

  async executeTrade(args: ExecuteTradeInput<SupportedChainIds>): Promise<TradeResult> {
    console.info(args)
    throw new Error('CowSwapper: executeTrade unimplemented')
  }

  async approvalNeeded(
    args: ApprovalNeededInput<SupportedChainIds>
  ): Promise<ApprovalNeededOutput> {
    return CowApprovalNeeded(this.deps, args)
  }

  async approveInfinite(args: ApproveInfiniteInput<SupportedChainIds>): Promise<string> {
    return CowApproveInfinite(this.deps, args)
  }

  filterBuyAssetsBySellAssetId(args: BuyAssetBySellIdInput): AssetId[] {
    console.info(args)
    return []
  }

  filterAssetIdsBySellable(assetIds: AssetId[]): AssetId[] {
    console.info(assetIds)
    return []
  }

  async getTradeTxs(): Promise<TradeTxs> {
    throw new Error('CowSwapper: executeTrade unimplemented')
  }
}
