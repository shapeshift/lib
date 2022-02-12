import { adapters } from '@shapeshiftoss/caip'
import { fromCAIP19 } from '@shapeshiftoss/caip/dist/caip19/caip19'
import {
  FindAllMarketArgs,
  HistoryData,
  HistoryTimeframe,
  MarketCapResult,
  MarketData,
  MarketDataArgs,
  PriceHistoryArgs
} from '@shapeshiftoss/types'
import dayjs from 'dayjs'
import omit from 'lodash/omit'

import { MarketService } from '../api'
import { COINCAP_MAX_RPS } from '../constants'
import { bn, bnOrZero } from '../utils/bignumber'
import { getRatelimitedAxios } from '../utils/getRatelimitedAxios'
import { isValidDate } from '../utils/isValidDate'
import { CoinCapMarketCap } from './coincap-types'

const axios = getRatelimitedAxios(COINCAP_MAX_RPS)

export class CoinCapMarketService implements MarketService {
  baseUrl = 'https://api.coincap.io/v2'

  private readonly defaultGetByMarketCapArgs: FindAllMarketArgs = {
    count: 2500
  }

  findAll = async (args?: FindAllMarketArgs) => {
    const argsToUse = { ...this.defaultGetByMarketCapArgs, ...args }
    const { count } = argsToUse
    const perPage = count > 250 ? 250 : count
    const pages = Math.ceil(bnOrZero(count).div(perPage).toNumber())
    const urlAtPage = (page: number) => `${this.baseUrl}/assets?limit=${perPage}&offset=${page}`
    const pageCount = Array(pages)
      .fill(0)
      .map((_v, i) => i + 1)

    try {
      const combined = (
        await Promise.all(
          pageCount.map(async (page) => axios.get<{ data: CoinCapMarketCap[] }>(urlAtPage(page)))
        )
      ).flat()

      return combined
        .map(({ data }) => (data && data.data ? data.data : [])) // filter out rate limited results
        .flat()
        .sort((a, b) => (a.rank > b.rank ? 1 : -1))
        .reduce((acc, cur) => {
          const { id } = cur
          try {
            const caip19 = adapters.coincapToCAIP19(id)
            if (!caip19) return acc
            const curWithoutId = omit(cur, 'id') // don't leak this through to clients
            acc[caip19] = {
              price: curWithoutId.priceUsd.toString(),
              marketCap: curWithoutId.marketCapUsd.toString(),
              volume: curWithoutId.volumeUsd24Hr.toString(),
              changePercent24Hr: parseFloat(curWithoutId.changePercent24Hr)
            }
            return acc
          } catch {
            return acc // no caip found, we don't support this asset
          }
        }, {} as MarketCapResult)
    } catch (e) {
      return {}
    }
  }

  findByCaip19 = async ({ caip19 }: MarketDataArgs): Promise<MarketData | null> => {
    if (!adapters.CAIP19ToCoinCap(caip19)) return null
    try {
      const { tokenId } = fromCAIP19(caip19)
      const id = tokenId ? 'ethereum' : adapters.CAIP19ToCoinCap(caip19)

      const { data } = await axios.get(`${this.baseUrl}/assets/${id}`)

      const marketData = data.data as CoinCapMarketCap
      return {
        price: marketData.priceUsd,
        marketCap: marketData.marketCapUsd,
        changePercent24Hr: parseFloat(marketData.changePercent24Hr),
        volume: marketData.volumeUsd24Hr
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
    if (!adapters.CAIP19ToCoinCap(caip19)) return []
    const { tokenId } = fromCAIP19(caip19)
    const id = tokenId ? 'ethereum' : adapters.CAIP19ToCoinCap(caip19)

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
      const contract = tokenId ? `/contract/${tokenId}` : ''
      const url = `${this.baseUrl}/assets/${id}${contract}/history`
      type CoincapHistoryData = {
        data: {
          priceUsd: number
          time: number
        }[]
      }
      const {
        data: { data: coincapData }
      } = await axios.get<CoincapHistoryData>(
        `${url}?id=${id}&start=${from}&end=${to}&interval=${interval}`
      )

      return coincapData.reduce<HistoryData[]>((acc, current) => {
        const date = current.time
        if (!isValidDate(date)) {
          console.error('Coincap asset history data has invalid date')
          return acc
        }
        const price = bn(current.priceUsd)
        if (price.isNaN()) {
          console.error('Coincap asset history data has invalid price')
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
      throw new Error('MarketService(findPriceHistoryByCaip19): error fetching price history')
    }
  }
}
