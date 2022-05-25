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
import axios from 'axios'

import { Swapper, Trade, TradeQuote } from '../../api'
import { midgardService } from './utils'

export class ThorchainSwapper implements Swapper {
  // Map our caip chain ids to symbols understood by thorchain
  private supportedChainIdToSymbol = {
    'eip155:1': 'ETH'
  }

  // ETH, BTC
  private supportedChainIds = Object.keys(this.supportedChainIdToSymbol)

  // Populated by initialize()
  // private supportedAssetIds = []

  getType() {
    return SwapperType.Thorchain
  }

  async initialize() {
    console.log('supportedChainIds!', this.supportedChainIds)

    try {
      console.log('fuck!!')
      const res = await axios.get(
        'https://thor-midgard.cointainers.prod.chiefhappinessofficerellie.org/'
      )
      console.log('res is', res)
      const poolsResponse = await midgardService.get('/v2/pools')
      console.log('poolsResponse!', poolsResponse)
    } catch (e) {
      console.log('e is', { e })
    }

    // assetId: toAssetId({
    //   chain: ChainTypes.Ethereum,
    //   network: NetworkTypes.MAINNET,
    //   assetNamespace: 'erc20',
    //   assetReference: token.address
    // })
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
