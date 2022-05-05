import {
  HistoryData,
  HistoryTimeframe,
  MarketCapResult,
  MarketData,
  MarketDataArgs,
  PriceHistoryArgs
} from '@shapeshiftoss/types'
import dayjs from 'dayjs'

import { MarketService } from '../api'
import { CoinCapMarketCap } from '../coincap/coincap-types'
import { RATE_LIMIT_THRESHOLDS_PER_MINUTE } from '../config'
import { bn } from '../utils/bignumber'
import { isValidDate } from '../utils/isValidDate'
import { rateLimitedAxios } from '../utils/rateLimiters'

export const FOXY_CAIP19 = 'eip155:1/erc20:0xDc49108ce5C57bc3408c3A5E95F3d864eC386Ed3'
const FOX_COINCAP_ID = 'fox-token'

const axios = rateLimitedAxios(RATE_LIMIT_THRESHOLDS_PER_MINUTE.COINCAP)

export class FoxyMarketService implements MarketService {
  baseUrl = 'https://api.coincap.io/v2'

  findAll = async () => {
    try {
      const assetId = FOXY_CAIP19
      const marketData = await this.findByCaip19({ assetId })

      return { [assetId]: marketData } as MarketCapResult
    } catch (e) {
      console.warn(e)
      return {}
    }
  }

  findByCaip19 = async ({ assetId }: MarketDataArgs): Promise<MarketData | null> => {
    try {
      if (assetId.toLowerCase() !== FOXY_CAIP19.toLowerCase()) {
        console.warn('FoxyMarketService(findByCaip19): Failed to find by Caip19')
        return null
      }

      const { data } = await axios.get(`${this.baseUrl}/assets/${FOX_COINCAP_ID}`)
      const marketData = data.data as CoinCapMarketCap

      return {
        price: marketData.priceUsd,
        marketCap: '0', // TODO: add marketCap once able to get foxy marketCap data
        changePercent24Hr: parseFloat(marketData.changePercent24Hr),
        volume: '0' // TODO: add volume once able to get foxy volume data
      }
    } catch (e) {
      console.warn(e)
      throw new Error('FoxyMarketService(findByCaip19): error fetching market data')
    }
  }

  findPriceHistoryByCaip19 = async ({
    assetId,
    timeframe
  }: PriceHistoryArgs): Promise<HistoryData[]> => {
    if (assetId.toLowerCase() !== FOXY_CAIP19.toLowerCase()) {
      console.warn(
        'FoxyMarketService(findPriceHistoryByCaip19): Failed to find price history by Caip19'
      )
      return []
    }

    const end = dayjs().startOf('minute')
    let start
    let interval
    switch (timeframe) {
      case HistoryTimeframe.HOUR:
        start = end.subtract(1, 'hour')
        interval = 'm5'
        break
      case HistoryTimeframe.DAY:
        start = end.subtract(1, 'day')
        interval = 'h1'
        break
      case HistoryTimeframe.WEEK:
        start = end.subtract(1, 'week')
        interval = 'd1'
        break
      case HistoryTimeframe.MONTH:
        start = end.subtract(1, 'month')
        interval = 'd1'
        break
      case HistoryTimeframe.YEAR:
        start = end.subtract(1, 'year')
        interval = 'd1'
        break
      case HistoryTimeframe.ALL:
        start = end.subtract(20, 'years')
        interval = 'd1'
        break
      default:
        start = end
    }

    try {
      const from = start.valueOf()
      const to = end.valueOf()
      const url = `${this.baseUrl}/assets/${FOX_COINCAP_ID}/history`
      type CoincapHistoryData = {
        data: {
          priceUsd: number
          time: number
        }[]
      }
      const {
        data: { data: coincapData }
      } = await axios.get<CoincapHistoryData>(
        `${url}?id=${FOX_COINCAP_ID}&start=${from}&end=${to}&interval=${interval}`
      )

      return coincapData.reduce<HistoryData[]>((acc, current) => {
        const date = current.time
        if (!isValidDate(date)) {
          console.error('FOXy asset history data has invalid date')
          return acc
        }
        const price = bn(current.priceUsd)
        if (price.isNaN()) {
          console.error('FOXy asset history data has invalid price')
          return acc
        }
        acc.push({
          date,
          price: price.toNumber()
        })
        return acc
      }, [])
    } catch (e) {
      console.warn(e)
      throw new Error('FoxyMarketService(findPriceHistoryByCaip19): error fetching price history')
    }
  }
}
