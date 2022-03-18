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
import { RATE_LIMIT_THRESHOLDS_PER_MINUTE } from '../config'
import { bn } from '../utils/bignumber'
import { isValidDate } from '../utils/isValidDate'
import { rateLimitedAxios } from '../utils/rateLimiters'
import { CoinCapMarketCap } from '../coincap/coincap-types'

export const FOXY_CAIP19 = 'eip155:1/erc20:0x61FcaBB591d63D00E897A67C64658D376FeAd816'
const FOX_COINCAP_ID = 'fox-token'

const axios = rateLimitedAxios(RATE_LIMIT_THRESHOLDS_PER_MINUTE.COINGECKO)

export class FoxyMarketService implements MarketService {
  baseUrl = 'https://api.coincap.io/v2'

  findAll = async () => {
    try {
      const caip19 = FOXY_CAIP19
      const marketData = await this.findByCaip19({ caip19 })
      return { [caip19]: marketData } as MarketCapResult
    } catch (e) {
      return {}
    }
  }

  findByCaip19 = async ({ caip19 }: MarketDataArgs): Promise<MarketData | null> => {
    try {
      if (caip19 !== FOXY_CAIP19) return null
      const { data } = await axios.get(`${this.baseUrl}/assets/${FOX_COINCAP_ID}`)

      const marketData = data.data as CoinCapMarketCap
      return {
        price: marketData.priceUsd,
        marketCap: '0',
        changePercent24Hr: parseFloat(marketData.changePercent24Hr),
        volume: '0'
      }
    } catch (e) {
      console.warn(e)
      throw new Error('FoxyMarketService(findByCaip19): error fetching market data')
    }
  }

  findPriceHistoryByCaip19 = async ({
    caip19,
    timeframe
  }: PriceHistoryArgs): Promise<HistoryData[]> => {
    if (caip19 !== FOXY_CAIP19) return []

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
