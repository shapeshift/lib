import {
  HistoryData,
  MarketCapResult,
  MarketData,
  MarketDataArgs,
  PriceHistoryArgs,
  PriceHistoryType
} from '@shapeshiftoss/types'
import { FindAllMarketArgs } from '@shapeshiftoss/types/src'

import { CoinGeckoMarketService } from './coingecko/coingecko'

const MarketProviders = [new CoinGeckoMarketService()]

export const findAll = async (args?: FindAllMarketArgs): Promise<MarketCapResult> => {
  let result: MarketCapResult | null = null
  for (let i = 0; i < MarketProviders.length && !result; i++) {
    result = await MarketProviders[i].findAll(args)
  }
  if (!result) throw new Error('Cannot find market service provider for market data.')
  return result
}

export const findByCaip19 = async ({ caip19 }: MarketDataArgs) => {
  let result: MarketData | null = null
  for (let i = 0; i < MarketProviders.length && !result; i++) {
    result = await MarketProviders[i].findByCaip19({ caip19 })
  }
  if (!result) return null
  return result
}

export const findPriceHistoryByCaip19: PriceHistoryType = async ({
  caip19,
  timeframe
}: PriceHistoryArgs): Promise<HistoryData[]> => {
  let result: HistoryData[] | null = null
  for (let i = 0; i < MarketProviders.length && !result; i++) {
    result = await MarketProviders[i].findPriceHistoryByCaip19({ caip19, timeframe })
  }
  if (!result) return []
  return result
}
