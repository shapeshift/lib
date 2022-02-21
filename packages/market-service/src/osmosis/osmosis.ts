import axios from 'axios'
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
    const { data } = await axios.get<OsmosisMarketCap[]>(osmosisApiUrl)
    const results = data.map((token: OsmosisMarketCap) => {
      return {
        price: token.price.toString(),
        marketCap: token.liquidity.toString(),
        volume: token.volume_24h.toString(),
        changePercent24Hr: token.price_24h_change
      }
    })

    return {
      '1234': {
        price: '1234',
        marketCap: '1234',
        volume: '1234',
        changePercent24Hr: 1234.12
      }
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
