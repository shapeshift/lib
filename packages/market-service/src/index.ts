import {
  HistoryData,
  MarketCapResult,
  MarketData,
  MarketDataArgs,
  PriceHistoryArgs,
  PriceHistoryType
} from '@shapeshiftoss/types'
import { Yearn } from '@yfi/sdk'
import { JsonRpcProvider } from '@ethersproject/providers'
import { FindAllMarketArgs } from '@shapeshiftoss/types/src'

import { CoinGeckoMarketService } from './coingecko/coingecko'
import { YearnMarketCapService } from './yearn/yearn'

// YearnMarketCapService deps
const provider = new JsonRpcProvider('https://dev-daemon.ethereum.shapeshift.com')
const yearnSdk = new Yearn(1, { provider })

// Order of this MarketProviders array constitutes the order of provders we will be checking first.
// More reliable providers should be listed first.
const MarketProviders = [new CoinGeckoMarketService(), new YearnMarketCapService({ yearnSdk })]

export const findAll = async (args?: FindAllMarketArgs): Promise<MarketCapResult> => {
  let result: MarketCapResult | null = null
  // Go through market providers listed above and look for market data for all assets.
  // Once data is found, exit the loop and return result. If no data is found for any
  // provider, throw an error.
  for (let i = 0; i < MarketProviders.length && !result; i++) {
    try {
      result = await MarketProviders[i].findAll(args)
    } catch (e) {
      console.info(e)
    }
  }
  if (!result) throw new Error('Cannot find market service provider for market data.')
  return result
}

export const findByCaip19 = async ({ caip19 }: MarketDataArgs) => {
  let result: MarketData | null = null
  // Loop through market providers and look for asset market data. Once found, exit loop.
  for (let i = 0; i < MarketProviders.length && !result; i++) {
    try {
      result = await MarketProviders[i].findByCaip19({ caip19 })
    } catch (e) {
      console.info(e)
    }
  }
  if (!result) return null
  return result
}

export const findPriceHistoryByCaip19: PriceHistoryType = async ({
  caip19,
  timeframe
}: PriceHistoryArgs): Promise<HistoryData[]> => {
  let result: HistoryData[] | null = null
  // Loop through market providers and look for asset price history data. Once found, exit loop.
  for (let i = 0; i < MarketProviders.length && !result; i++) {
    try {
      result = await MarketProviders[i].findPriceHistoryByCaip19({ caip19, timeframe })
    } catch (e) {
      console.info(e)
    }
  }
  if (!result) return []
  return result
}
