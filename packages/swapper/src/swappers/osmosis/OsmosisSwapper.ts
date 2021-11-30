import {
  ApprovalNeededOutput,
  Asset,
  ChainTypes,
  ExecQuoteOutput,
  GetQuoteInput,
  MinMaxOutput,
  Quote,
  SwapperType
} from '@shapeshiftoss/types'

import { Swapper } from '../../api'

export class OsmosisSwapper implements Swapper {
  getType() {
    return SwapperType.Osmosis
  }

  async getQuote(): Promise<Quote<ChainTypes, SwapperType>> {
    throw new Error('OsmosisSwapper: getQuote unimplemented')
  }

  async buildQuoteTx(): Promise<Quote<ChainTypes, SwapperType>> {
    throw new Error('OsmosisSwapper: getQuote unimplemented')
  }

  getUsdRate(input: Pick<Asset, 'symbol' | 'tokenId'>): Promise<string> {
    console.info(input)
    throw new Error('OsmosisSwapper: getUsdRate unimplemented')
  }

  getMinMax(input: GetQuoteInput): Promise<MinMaxOutput> {
    console.info(input)
    throw new Error('OsmosisSwapper: getMinMax unimplemented')
  }

  getAvailableAssets(assets: Asset[]): Asset[] {
    console.info(assets)
    throw new Error('OsmosisSwapper: getAvailableAssets unimplemented')
  }

  canTradePair(sellAsset: Asset, buyAsset: Asset): boolean {
    console.info(sellAsset, buyAsset)
    throw new Error('OsmosisSwapper: canTradePair unimplemented')
  }

  async executeQuote(): Promise<ExecQuoteOutput> {
    throw new Error('OsmosisSwapper: executeQuote unimplemented')
  }

  getDefaultPair(): Pick<Asset, 'chain' | 'symbol' | 'name'>[] {
    throw new Error('OsmosisSwapper: getDefaultPair unimplemented')
  }

  async approvalNeeded(): Promise<ApprovalNeededOutput> {
    throw new Error('OsmosisSwapper: approvalNeeded unimplemented')
  }

  async approveInfinite(): Promise<string> {
    throw new Error('OsmosisSwapper: approveInfinite unimplemented')
  }

  async getSendMaxAmount(): Promise<string> {
    throw new Error('OsmosisSwapper: getSendMaxAmount unimplemented')
  }
}
