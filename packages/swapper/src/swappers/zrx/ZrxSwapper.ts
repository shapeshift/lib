import { AssetId, ChainId } from '@shapeshiftoss/caip'
import { avalanche, ethereum } from '@shapeshiftoss/chain-adapters'
import { Asset, KnownChainIds } from '@shapeshiftoss/types'
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
  TradeQuote,
  TradeResult,
  TradeTxs,
  ZrxTrade
} from '../../api'
import { getZrxTradeQuote } from './getZrxTradeQuote/getZrxTradeQuote'
import { UNSUPPORTED_ASSETS } from './utils/blacklist'
import { getUsdRate } from './utils/helpers/helpers'
import { zrxApprovalNeeded } from './zrxApprovalNeeded/zrxApprovalNeeded'
import { zrxApproveInfinite } from './zrxApproveInfinite/zrxApproveInfinite'
import { zrxBuildTrade } from './zrxBuildTrade/zrxBuildTrade'
import { zrxExecuteTrade } from './zrxExecuteTrade/zrxExecuteTrade'

export type ZrxSwapperDeps = {
  adapter: ethereum.ChainAdapter | avalanche.ChainAdapter
  web3: Web3
}

export type ZrxSupportedChainIds = KnownChainIds.EthereumMainnet | KnownChainIds.AvalancheMainnet

type GetZrxSwapTradeQuoteInput = GetTradeQuoteInput & {
  chainId: ZrxSupportedChainIds
}

export class ZrxSwapper<T extends ZrxSupportedChainIds> implements Swapper<ZrxSupportedChainIds> {
  public static swapperName = 'ZrxSwapper'
  deps: ZrxSwapperDeps
  chainId: ChainId

  constructor(deps: ZrxSwapperDeps) {
    this.deps = deps
    this.chainId = deps.adapter.getChainId()
  }

  // noop for zrx
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async initialize() {}

  getType() {
    return SwapperType.Zrx
  }

  async buildTrade(args: BuildTradeInput): Promise<ZrxTrade> {
    return zrxBuildTrade(this.deps, args)
  }

  async getTradeQuote(input: GetZrxSwapTradeQuoteInput): Promise<TradeQuote<ZrxSupportedChainIds>> {
    return getZrxTradeQuote(input)
  }

  async getUsdRate(input: Asset): Promise<string> {
    return getUsdRate(input)
  }

  async executeTrade(args: ExecuteTradeInput<T>): Promise<TradeResult> {
    return zrxExecuteTrade(this.deps, args)
  }

  async approvalNeeded(args: ApprovalNeededInput<T>): Promise<ApprovalNeededOutput> {
    return zrxApprovalNeeded(this.deps, args)
  }

  async approveInfinite(args: ApproveInfiniteInput<ZrxSupportedChainIds>): Promise<string> {
    return zrxApproveInfinite(this.deps, args)
  }

  filterBuyAssetsBySellAssetId(args: BuyAssetBySellIdInput): AssetId[] {
    const { assetIds = [], sellAssetId } = args
    return assetIds.filter(
      (id) =>
        id.startsWith(this.chainId) &&
        sellAssetId?.startsWith(this.chainId) &&
        !UNSUPPORTED_ASSETS.includes(id)
    )
  }

  filterAssetIdsBySellable(assetIds: AssetId[] = []): AssetId[] {
    return assetIds.filter((id) => id.startsWith(this.chainId) && !UNSUPPORTED_ASSETS.includes(id))
  }

  async getTradeTxs(tradeResult: TradeResult): Promise<TradeTxs> {
    return {
      sellTxid: tradeResult.tradeId,
      buyTxid: tradeResult.tradeId
    }
  }
}
