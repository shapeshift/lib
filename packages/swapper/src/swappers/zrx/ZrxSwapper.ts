import { AssetId } from '@shapeshiftoss/caip'
import { ChainAdapterManager } from '@shapeshiftoss/chain-adapters'
import { Asset, SupportedChainIds, SwapperType } from '@shapeshiftoss/types'
import Web3 from 'web3'

import {
  ApprovalNeededInput,
  ApprovalNeededOutput,
  ApproveInfiniteInput,
  BuildTradeInput,
  BuyAssetBySellIdInput,
  ExecuteTradeInput,
  GetMinMaxInput,
  GetTradeQuoteInput,
  MinMaxOutput,
  Swapper,
  TradeQuote,
  TradeResult,
  ZrxTrade
} from '../../api'
import { getZrxMinMax } from './getZrxMinMax/getZrxMinMax'
import { getZrxTradeQuote } from './getZrxTradeQuote/getZrxTradeQuote'
import { UNSUPPORTED_ASSETS } from './utils/blacklist'
import { getUsdRate } from './utils/helpers/helpers'
import { ZrxApprovalNeeded } from './ZrxApprovalNeeded/ZrxApprovalNeeded'
import { ZrxApproveInfinite } from './ZrxApproveInfinite/ZrxApproveInfinite'
import { zrxBuildTrade } from './zrxBuildTrade/zrxBuildTrade'
import { zrxExecuteTrade } from './zrxExecuteTrade/zrxExecuteTrade'

export type ZrxSwapperDeps = {
  adapterManager: ChainAdapterManager
  web3: Web3
}

export class ZrxSwapper implements Swapper {
  public static swapperName = 'ZrxSwapper'
  deps: ZrxSwapperDeps

  constructor(deps: ZrxSwapperDeps) {
    this.deps = deps
  }

  // noop for zrx
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async initialize() {}

  getType() {
    return SwapperType.Zrx
  }

  async buildTrade(args: BuildTradeInput): Promise<ZrxTrade<SupportedChainIds>> {
    return zrxBuildTrade(this.deps, args)
  }

  async getTradeQuote(input: GetTradeQuoteInput): Promise<TradeQuote<SupportedChainIds>> {
    return getZrxTradeQuote(input)
  }

  async getUsdRate(input: Pick<Asset, 'symbol' | 'assetId'>): Promise<string> {
    return getUsdRate(input)
  }

  async getMinMax(input: GetMinMaxInput): Promise<MinMaxOutput> {
    return getZrxMinMax(input.sellAsset, input.buyAsset)
  }

  async executeTrade(args: ExecuteTradeInput<SupportedChainIds>): Promise<TradeResult> {
    return zrxExecuteTrade(this.deps, args)
  }

  async approvalNeeded(
    args: ApprovalNeededInput<SupportedChainIds>
  ): Promise<ApprovalNeededOutput> {
    return ZrxApprovalNeeded(this.deps, args)
  }

  async approveInfinite(args: ApproveInfiniteInput<SupportedChainIds>): Promise<string> {
    return ZrxApproveInfinite(this.deps, args)
  }

  filterBuyAssetsBySellAssetId(args: BuyAssetBySellIdInput): AssetId[] {
    const { assetIds = [], sellAssetId } = args
    return assetIds.filter(
      (id) =>
        id.startsWith('eip155:1') &&
        sellAssetId?.startsWith('eip155:1') &&
        !UNSUPPORTED_ASSETS.includes(id)
    )
  }

  filterAssetIdsBySellable(assetIds: AssetId[] = []): AssetId[] {
    return assetIds.filter((id) => id.startsWith('eip155:1') && !UNSUPPORTED_ASSETS.includes(id))
  }
}
