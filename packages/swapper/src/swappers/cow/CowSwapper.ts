import { AssetId } from '@shapeshiftoss/caip'
import { Asset, SupportedChainId } from '@shapeshiftoss/types'

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

export class CowSwapper implements Swapper {
  public static swapperName = 'CowSwapper'

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async initialize() {}

  getType() {
    return SwapperType.CowSwap
  }

  async buildTrade(args: BuildTradeInput): Promise<Trade<SupportedChainId>> {
    console.info(args)
    throw new Error('CowSwapper: buildTrade unimplemented')
  }

  async getTradeQuote(input: GetTradeQuoteInput): Promise<TradeQuote<SupportedChainId>> {
    console.info(input)
    throw new Error('CowSwapper: getTradeQuote unimplemented')
  }

  getUsdRate(input: Pick<Asset, 'symbol' | 'assetId'>): Promise<string> {
    console.info(input)
    throw new Error('CowSwapper: getUsdRate unimplemented')
  }

  async executeTrade(args: ExecuteTradeInput<SupportedChainId>): Promise<TradeResult> {
    console.info(args)
    throw new Error('CowSwapper: executeTrade unimplemented')
  }

  async approvalNeeded(args: ApprovalNeededInput<SupportedChainId>): Promise<ApprovalNeededOutput> {
    console.info(args)
    throw new Error('CowSwapper: approvalNeeded unimplemented')
  }

  async approveInfinite(args: ApproveInfiniteInput<SupportedChainId>): Promise<string> {
    console.info(args)
    throw new Error('CowSwapper: approveInfinite unimplemented')
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
