import { AssetId } from '@shapeshiftoss/caip'
import { ethereum } from '@shapeshiftoss/chain-adapters'
import { Asset } from '@shapeshiftoss/types'

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
import { getCowSwapTradeQuote } from './getCowSwapTradeQuote/getCowSwapTradeQuote'
import { COWSWAP_UNSUPPORTED_ASSETS } from './utils/blacklist'
import { getUsdRate } from './utils/helpers/helpers'

export type CowSwapperDeps = {
  apiUrl: string
  adapter: ethereum.ChainAdapter
}

export class CowSwapper implements Swapper<'eip155:1'> {
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

  async buildTrade(args: BuildTradeInput): Promise<Trade<'eip155:1'>> {
    console.info(args)
    throw new Error('CowSwapper: buildTrade unimplemented')
  }

  async getTradeQuote(input: GetTradeQuoteInput): Promise<TradeQuote<'eip155:1'>> {
    return getCowSwapTradeQuote(this.deps, input)
  }

  async getUsdRate(input: Asset): Promise<string> {
    return getUsdRate(this.deps, input)
  }

  async executeTrade(args: ExecuteTradeInput<'eip155:1'>): Promise<TradeResult> {
    console.info(args)
    throw new Error('CowSwapper: executeTrade unimplemented')
  }

  async approvalNeeded(args: ApprovalNeededInput<'eip155:1'>): Promise<ApprovalNeededOutput> {
    console.info(args)
    throw new Error('CowSwapper: approvalNeeded unimplemented')
  }

  async approveInfinite(args: ApproveInfiniteInput<'eip155:1'>): Promise<string> {
    console.info(args)
    throw new Error('CowSwapper: approveInfinite unimplemented')
  }

  filterBuyAssetsBySellAssetId(args: BuyAssetBySellIdInput): AssetId[] {
    const { assetIds = [], sellAssetId } = args
    if (
      !sellAssetId?.startsWith('eip155:1/erc20') ||
      COWSWAP_UNSUPPORTED_ASSETS.includes(sellAssetId)
    )
      return []

    return assetIds.filter(
      (id) =>
        id !== sellAssetId &&
        id.startsWith('eip155:1/erc20') &&
        !COWSWAP_UNSUPPORTED_ASSETS.includes(id)
    )
  }

  filterAssetIdsBySellable(assetIds: AssetId[]): AssetId[] {
    return assetIds.filter(
      (id) => id.startsWith('eip155:1/erc20') && !COWSWAP_UNSUPPORTED_ASSETS.includes(id)
    )
  }

  async getTradeTxs(): Promise<TradeTxs> {
    throw new Error('CowSwapper: executeTrade unimplemented')
  }
}
