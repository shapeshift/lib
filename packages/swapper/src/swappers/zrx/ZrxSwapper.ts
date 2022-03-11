import { CAIP19, caip19, WellKnownChain } from '@shapeshiftoss/caip'
import { ChainAdapterManager } from '@shapeshiftoss/chain-adapters'
import {
  ApprovalNeededInput,
  ApprovalNeededOutput,
  ApproveInfiniteInput,
  Asset,
  BuildQuoteTxInput,
  ChainAdapterType,
  ExecQuoteInput,
  ExecQuoteOutput,
  GetQuoteInput,
  MinMaxOutput,
  Quote,
  SendMaxAmountInput,
  SwapperType
} from '@shapeshiftoss/types'
import Web3 from 'web3'

import { Swapper } from '../../api'
import { getZrxMinMax } from './getZrxMinMax/getZrxMinMax'
import { getZrxQuote } from './getZrxQuote/getZrxQuote'
import { getZrxSendMaxAmount } from './getZrxSendMaxAmount/getZrxSendMaxAmount'
import { getUsdRate } from './utils/helpers/helpers'
import { ZrxApprovalNeeded } from './ZrxApprovalNeeded/ZrxApprovalNeeded'
import { ZrxApproveInfinite } from './ZrxApproveInfinite/ZrxApproveInfinite'
import { ZrxBuildQuoteTx } from './ZrxBuildQuoteTx/ZrxBuildQuoteTx'
import { ZrxExecuteQuote } from './ZrxExecuteQuote/ZrxExecuteQuote'

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

  async buildQuoteTx(args: BuildQuoteTxInput): Promise<Quote<ChainAdapterType, SwapperType>> {
    return ZrxBuildQuoteTx(this.deps, args)
  }

  async getQuote(input: GetQuoteInput): Promise<Quote<ChainAdapterType, SwapperType>> {
    return getZrxQuote(input)
  }

  async getUsdRate(asset: Asset): Promise<string> {
    return getUsdRate(asset)
  }

  async getMinMax(input: GetQuoteInput): Promise<MinMaxOutput> {
    return getZrxMinMax(input)
  }

  getAvailableAssets(assets: Asset[]): Asset[] {
    return assets.filter((asset) => {
      const { chainId } = caip19.fromCAIP19(asset.assetId)
      return chainId === WellKnownChain.EthereumMainnet
    })
  }

  canTradePair(sellAsset: Asset, buyAsset: Asset): boolean {
    const availableAssets = this.getAvailableAssets([sellAsset, buyAsset])
    return availableAssets.length === 2
  }

  getDefaultPair(): [CAIP19, CAIP19] {
    const ETH = 'eip155:1/slip44:60'
    const FOX = 'eip155:1/erc20:0xc770eefad204b5180df6a14ee197d99d808ee52d'
    return [ETH, FOX]
  }

  async executeQuote(
    args: ExecQuoteInput<ChainAdapterType, SwapperType>
  ): Promise<ExecQuoteOutput> {
    return ZrxExecuteQuote(this.deps, args)
  }

  async approvalNeeded(
    args: ApprovalNeededInput<ChainAdapterType, SwapperType>
  ): Promise<ApprovalNeededOutput> {
    return ZrxApprovalNeeded(this.deps, args)
  }

  async approveInfinite(
    args: ApproveInfiniteInput<ChainAdapterType, SwapperType>
  ): Promise<string> {
    return ZrxApproveInfinite(this.deps, args)
  }

  async getSendMaxAmount(args: SendMaxAmountInput): Promise<string> {
    return getZrxSendMaxAmount(this.deps, args)
  }
}
