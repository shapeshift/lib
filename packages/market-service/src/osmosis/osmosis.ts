import axios from 'axios'
import { adapters } from '@shapeshiftoss/caip'
import { MarketService } from '../api'
import { OsmosisMarketCap } from './osmosis-types'
import {
  FindAllMarketArgs,
  HistoryData,
  HistoryTimeframe,
  MarketCapResult,
  MarketData,
  MarketDataArgs,
  PriceHistoryArgs
} from '@shapeshiftoss/types'

export class OsmosisMarketService implements MarketService {
  baseUrl = 'https://api-osmosis.imperator.co'

  findAll = async (args?: FindAllMarketArgs) => {
    const osmosisApiUrl = `${this.baseUrl}/tokens/v2/all`
    try{
      const { data }: { data: OsmosisMarketCap[] } = await axios.get(osmosisApiUrl)
      const results = data
      .map((data) => (data ?? [])) // filter out rate limited results
      .sort((a, b) => (a.liquidity < b.liquidity ? 1 : -1))
      .reduce((acc, token) => {
        const caip19 = adapters.osmosisToCAIP19(token.denom)
        if (!caip19) return acc

        acc[caip19] = {
          price: token.price.toString(),
          marketCap: token.liquidity.toString(),
          volume: token.volume_24h.toString(),
          changePercent24Hr: token.price_24h_change
        }

        return acc
      }, {} as MarketCapResult)

      return results

    } catch (e) {
      return {}
    }
  }

  findByCaip19 = async (args?: MarketDataArgs): Promise<MarketData | null> => {
    return {
      price: '0',
      marketCap: '0',
      volume: '0',
      changePercent24Hr: 0
    }
  }

  findPriceHistoryByCaip19 = async (args?: PriceHistoryArgs): Promise<HistoryData[]> => {
    return [{ date: 12345, price: 12.1}]
  }
}
