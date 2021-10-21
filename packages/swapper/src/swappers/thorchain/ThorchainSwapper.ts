import { assetService, swapper } from '@shapeshiftoss/types'
import { Swapper } from '../../api'

export class ThorchainSwapper implements Swapper {
  getType() {
    return swapper.Type.Thorchain
  }

  async getQuote(): Promise<swapper.Quote> {
    throw new Error('ThorchainSwapper: getQuote unimplemented')
  }

  async buildQuoteTx(): Promise<swapper.Quote> {
    throw new Error('ThorchainSwapper: getQuote unimplemented')
  }

  getUsdRate(input: Pick<assetService.Asset, 'symbol' | 'tokenId'>): Promise<string> {
    console.info(input)
    throw new Error('ThorchainSwapper: getUsdRate unimplemented')
  }

  getMinMax(input: swapper.GetQuoteInput): Promise<swapper.MinMaxOutput> {
    console.info(input)
    throw new Error('ThorchainSwapper: getMinMax unimplemented')
  }

  getAvailableAssets(assets: assetService.Asset[]): assetService.Asset[] {
    console.info(assets)
    throw new Error('ThorchainSwapper: getAvailableAssets unimplemented')
  }

  canTradePair(sellAsset: assetService.Asset, buyAsset: assetService.Asset): boolean {
    console.info(sellAsset, buyAsset)
    throw new Error('ThorchainSwapper: canTradePair unimplemented')
  }

  async executeQuote(): Promise<swapper.ExecQuoteOutput> {
    throw new Error('ThorchainSwapper: executeQuote unimplemented')
  }

  getDefaultPair(): Pick<assetService.Asset, 'chain' | 'symbol' | 'name'>[] {
    throw new Error('ThorchainSwapper: getDefaultPair unimplemented')
  }

  async approvalNeeded(): Promise<swapper.ApprovalNeededOutput> {
    throw new Error('ThorchainSwapper: approvalNeeded unimplemented')
  }
}
