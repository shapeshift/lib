import { adapters } from '@shapeshiftoss/caip'
import {
  HistoryData,
  HistoryTimeframe,
  MarketCapResult,
  MarketData,
  MarketDataArgs,
  PriceHistoryArgs
} from '@shapeshiftoss/types'
import axios from 'axios'

import { MarketService } from '../api'
import { bnOrZero } from '../utils/bignumber'
import { isValidDate } from '../utils/isValidDate'
import { OsmosisHistoryData, OsmosisMarketCap } from './osmosis-types'

export class OsmosisMarketService implements MarketService {
  baseUrl = 'https://api-osmosis.imperator.co'

  findAll = async () => {
    const osmosisApiUrl = `${this.baseUrl}/tokens/v2/all`
    try {
      const { data: osmosisData }: { data: OsmosisMarketCap[] } = await axios.get(osmosisApiUrl)
      const results = osmosisData
        .map((data) => data ?? []) // filter out rate limited results
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

  findByCaip19 = async ({ caip19 }: MarketDataArgs): Promise<MarketData | null> => {
    if (!adapters.CAIP19ToOsmosis(caip19)) return null

    try {
      const symbol = adapters.CAIP19ToOsmosis(caip19)
      const { data }: { data: OsmosisMarketCap[] } = await axios.get(
        `${this.baseUrl}/tokens/v2/${symbol}`
      )
      const marketData = data[0]

      if (!marketData) return null

      return {
        price: marketData.price.toString(),
        marketCap: marketData.liquidity.toString(),
        volume: marketData.volume_24h.toString(),
        changePercent24Hr: bnOrZero(marketData.price_24h_change).toNumber()
      }
    } catch (e) {
      console.warn(e)
      throw new Error('MarketService(findByCaip19): error fetching market data')
    }
  }

  findPriceHistoryByCaip19 = async ({
    caip19,
    timeframe
  }: PriceHistoryArgs): Promise<HistoryData[]> => {
    if (!adapters.CAIP19ToOsmosis(caip19)) return []
    const symbol = adapters.CAIP19ToOsmosis(caip19)

    let range
    let isV1
    let start
    switch (timeframe) {
      case HistoryTimeframe.HOUR:
        range = '5'
        isV1 = false
        start = 12
        break
      case HistoryTimeframe.DAY:
        range = '60'
        isV1 = false
        start = 24
        break
      case HistoryTimeframe.WEEK:
        range = '7d'
        isV1 = true
        start = bnOrZero(24).times(7).toNumber()
        break
      case HistoryTimeframe.MONTH:
        range = '1mo'
        isV1 = true
        start = bnOrZero(24).times(30).toNumber()
        break
      case HistoryTimeframe.YEAR:
        range = '1y'
        isV1 = true
        start = bnOrZero(24).times(365).toNumber()
        break
      case HistoryTimeframe.ALL:
        // TODO: currently the 'all' range for v2 is returning 500 errors. Using 1y for the time being.
        // We need to revisit this at a later date to see if it works in the future
        range = '1y'
        isV1 = true
        start = 0
        break
      default:
        range = '1y'
        isV1 = true
        start = 0
    }

    try {
      // Historical timeframe data from the v2 endpoint currently does not support ranges greater than 1 month
      // and v1 doesn't support ranges less than 7 week, so we use both to get all ranges.
      const url = `${this.baseUrl}/tokens/${isV1 ? 'v1' : 'v2'}/historical/${symbol}/chart?${
        isV1 ? 'range' : 'tf'
      }=${range}`

      const { data } = await axios.get<OsmosisHistoryData[]>(url)

      // return the correct range of data points for each timeframe
      const taperedData = data.slice(-start)

      return taperedData.reduce<HistoryData[]>((acc, current) => {
        // convert timestamp from seconds to milliseconds
        const date = bnOrZero(current.time).times(1000).toNumber()
        if (!isValidDate(date)) {
          console.error('Osmosis asset history data has invalid date')
          return acc
        }
        const price = bnOrZero(current.close)
        acc.push({
          date,
          price: price.toNumber()
        })
        return acc
      }, [])
    } catch (e) {
      console.warn(e)
      throw new Error('MarketService(findPriceHistoryByCaip19): error fetching price history')
    }
  }
}
