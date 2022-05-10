import { CAIP19 } from '@shapeshiftoss/caip'
import { ChainAdapterManager } from '@shapeshiftoss/chain-adapters'
import {
  ApprovalNeededOutput,
  Asset,
  ExecQuoteOutput,
  GetQuoteInput,
  MinMaxOutput,
  SwapperType
} from '@shapeshiftoss/types'
import Web3 from 'web3'

import {
  ApprovalNeededInput,
  ApproveInfiniteInput,
  BuildTradeInput,
  BuyAssetBySellIdInput,
  ChainIdTypes,
  ExecuteTradeInput,
  GetTradeQuoteInput,
  Swapper,
  Trade,
  TradeQuote
} from '../../api'
import { getZrxMinMax } from './getZrxMinMax/getZrxMinMax'
import { getZrxTradeQuote } from './getZrxTradeQuote/getZrxTradeQuote'
import { getUsdRate } from './utils/helpers/helpers'
import { ZrxApprovalNeeded } from './ZrxApprovalNeeded/ZrxApprovalNeeded'
import { ZrxApproveInfinite } from './ZrxApproveInfinite/ZrxApproveInfinite'
import { zrxBuildTrade } from './zrxBuildTrade/zrxBuildTrade'
import { zrxExecuteTrade } from './zrxExecuteTrade/zrxExecuteTrade'

export type ZrxSwapperDeps = {
  adapterManager: ChainAdapterManager
  web3: Web3
}

export class ZrxError extends Error {
  constructor(message: string) {
    super(message)
    this.message = `ZrxError:${message}`
  }
}

export class ZrxSwapper implements Swapper {
  public static swapperName = 'ZrxSwapper'
  deps: ZrxSwapperDeps

  constructor(deps: ZrxSwapperDeps) {
    this.deps = deps
  }

  getType() {
    return SwapperType.Zrx
  }

  async buildTrade(args: BuildTradeInput): Promise<Trade<ChainIdTypes>> {
    return zrxBuildTrade(this.deps, args)
  }

  async getTradeQuote(input: GetTradeQuoteInput): Promise<TradeQuote<ChainIdTypes>> {
    return getZrxTradeQuote(input)
  }

  async getUsdRate(input: Pick<Asset, 'symbol' | 'tokenId'>): Promise<string> {
    return getUsdRate(input)
  }

  async getMinMax(input: GetQuoteInput): Promise<MinMaxOutput> {
    return getZrxMinMax(input)
  }

  async executeTrade(args: ExecuteTradeInput<ChainIdTypes>): Promise<ExecQuoteOutput> {
    return zrxExecuteTrade(this.deps, args)
  }

  async approvalNeeded(args: ApprovalNeededInput<ChainIdTypes>): Promise<ApprovalNeededOutput> {
    return ZrxApprovalNeeded(this.deps, args)
  }

  async approveInfinite(args: ApproveInfiniteInput<ChainIdTypes>): Promise<string> {
    return ZrxApproveInfinite(this.deps, args)
  }

  filterBuyAssetsBySellAssetId(args: BuyAssetBySellIdInput): CAIP19[] {
    const { assetIds, sellAssetId } = args
    // TODO: pending changes to caip lib, we may want to import caip2 value instead.
    return assetIds.filter((id) => id.startsWith('eip155:1') && sellAssetId.startsWith('eip155:1'))
  }

  filterAssetIdsBySellable(assetIds: CAIP19[]): CAIP19[] {
    return assetIds.filter((id) => id.startsWith('eip155:1'))
  }
}
