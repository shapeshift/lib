/* eslint-disable no-console */
import { AssetId } from '@shapeshiftoss/caip'
import {
  ApprovalNeededOutput,
  Asset,
  ExecQuoteOutput,
  GetMinMaxInput,
  MinMaxOutput,
  SupportedChainIds,
  SwapperType
} from '@shapeshiftoss/types'

import { Swapper, Trade, TradeQuote } from '../../api'
import { InitializeInput } from '../zrx/types'
import { midgardService } from './utils'

export class ThorchainSwapper implements Swapper {
  // ETH, BTC
  private supportedChainIds = ['eip155:1', 'bip122:000000000019d6689c085ae165831e93']

  getType() {
    return SwapperType.Thorchain
  }

  async initialize(input: InitializeInput) {
    console.log('initialize', input)
    console.log('supportedChainIds', this.supportedChainIds)
    const poolsResponse = await midgardService.get('/v2/pools')

    console.log('poolsResponse', poolsResponse)
  }

  getUsdRate(input: Pick<Asset, 'symbol' | 'assetId'>): Promise<string> {
    console.info(input)
    throw new Error('ThorchainSwapper: getUsdRate unimplemented')
  }

  getMinMax(input: GetMinMaxInput): Promise<MinMaxOutput> {
    console.info(input)
    throw new Error('ThorchainSwapper: getMinMax unimplemented')
  }

  async approvalNeeded(): Promise<ApprovalNeededOutput> {
    throw new Error('ThorchainSwapper: approvalNeeded unimplemented')
  }

  async approveInfinite(): Promise<string> {
    throw new Error('ThorchainSwapper: approveInfinite unimplemented')
  }

  filterBuyAssetsBySellAssetId(): AssetId[] {
    return []
  }

  filterAssetIdsBySellable(): AssetId[] {
    return []
  }

  async buildTrade(): Promise<Trade<SupportedChainIds>> {
    throw new Error('ThorchainSwapper: buildTrade unimplemented')
  }

  async getTradeQuote(): Promise<TradeQuote<SupportedChainIds>> {
    throw new Error('ThorchainSwapper: getTradeQuote unimplemented')
  }

  async executeTrade(): Promise<ExecQuoteOutput> {
    throw new Error('ThorchainSwapper: executeTrade unimplemented')
  }
}
