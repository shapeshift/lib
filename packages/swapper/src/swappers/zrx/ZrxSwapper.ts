import Web3 from 'web3'
import { assetService, ChainTypes, swapper } from '@shapeshiftoss/types'
import { ChainAdapterManager } from '@shapeshiftoss/chain-adapters'
import { Swapper } from '../../api'
import { buildQuoteTx } from './buildQuoteTx/buildQuoteTx'
import { getZrxQuote } from './getQuote/getQuote'
import { getUsdRate } from './utils/helpers/helpers'
import { getMinMax } from './getMinMax/getMinMax'
import { executeQuote } from './executeQuote/executeQuote'
import { approvalNeeded } from './approvalNeeded/approvalNeeded'

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
    return swapper.Type.Zrx
  }

  async buildQuoteTx(args: swapper.BuildQuoteTxInput): Promise<swapper.Quote> {
    return buildQuoteTx(this.deps, args)
  }

  async getQuote(input: swapper.GetQuoteInput): Promise<swapper.Quote> {
    return getZrxQuote(input)
  }

  async getUsdRate(input: Pick<assetService.Asset, 'symbol' | 'tokenId'>): Promise<string> {
    return getUsdRate(input)
  }

  async getMinMax(input: swapper.GetQuoteInput): Promise<swapper.MinMaxOutput> {
    return getMinMax(input)
  }

  getAvailableAssets(assets: assetService.Asset[]): assetService.Asset[] {
    return assets.filter((asset) => asset.chain === ChainTypes.Ethereum)
  }

  canTradePair(sellAsset: assetService.Asset, buyAsset: assetService.Asset): boolean {
    const availableAssets = this.getAvailableAssets([sellAsset, buyAsset])
    return availableAssets.length === 2
  }

  getDefaultPair(): Pick<assetService.Asset, 'chain' | 'symbol' | 'name'>[] {
    const ETH = { name: 'Ethereum', chain: ChainTypes.Ethereum, symbol: 'ETH' }
    const USDC = { name: 'USD Coin', chain: ChainTypes.Ethereum, symbol: 'USDC' }
    return [ETH, USDC]
  }

  async executeQuote(args: swapper.ExecQuoteInput): Promise<swapper.ExecQuoteOutput> {
    return executeQuote(this.deps, args)
  }

  async approvalNeeded(args: swapper.ApprovalNeededInput): Promise<swapper.ApprovalNeededOutput> {
    return approvalNeeded(this.deps, args)
  }
}
