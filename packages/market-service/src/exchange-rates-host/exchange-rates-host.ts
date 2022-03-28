import {
  FiatMarketDataArgs,
  FiatPriceHistoryArgs,
  HistoryData,
  HistoryTimeframe,
  MarketData
} from '@shapeshiftoss/types'
import dayjs from 'dayjs'

import { RATE_LIMIT_THRESHOLDS_PER_MINUTE } from '../config'
import { bnOrZero } from '../utils/bignumber'
import { isValidDate } from '../utils/isValidDate'
import { rateLimitedAxios } from '../utils/rateLimiters'
import { ExchangeRateHostHistoryData, ExchangeRateHostRate } from './exchange-rates-host-types'

const axios = rateLimitedAxios(RATE_LIMIT_THRESHOLDS_PER_MINUTE.DEFAULT)
const baseCurrency = 'USD'
const baseUrl = 'https://api.exchangerate.host'

export const findByFiatSymbol = async ({
  symbol
}: FiatMarketDataArgs): Promise<MarketData | null> => {
  try {
    const { data } = await axios.get<ExchangeRateHostRate>(
      `${baseUrl}/latest?base=${baseCurrency}&symbols=${symbol}`
    )
    const result = data as ExchangeRateHostRate
    // we only need the price key in the `web`
    return {
      price: result.rates[symbol].toString(),
      marketCap: '',
      changePercent24Hr: 0,
      volume: ''
    }
  } catch (e) {
    console.warn(e)
    throw new Error('FiatMarketService(findByFiatSymbol): error fetching market data')
  }
}

export const findPriceHistoryByFiatSymbol = async ({
  symbol,
  timeframe
}: FiatPriceHistoryArgs): Promise<HistoryData[]> => {
  const end = dayjs().startOf('day')
  let start
  switch (timeframe) {
    case HistoryTimeframe.HOUR:
      start = end.subtract(1, 'hour')
      break
    case HistoryTimeframe.DAY:
      start = end.subtract(1, 'day')
      break
    case HistoryTimeframe.WEEK:
      start = end.subtract(1, 'week')
      break
    case HistoryTimeframe.MONTH:
      start = end.subtract(1, 'month')
      break
    case HistoryTimeframe.YEAR:
      start = end.subtract(1, 'year')
      break
    case HistoryTimeframe.ALL:
      start = end.subtract(20, 'years')
      break
    default:
      start = end
  }

  try {
    const from = start.startOf('day').format('YYYY-MM-DD')
    const to = end.startOf('day').format('YYYY-MM-DD')
    const url = `${baseUrl}/timeseries?base=${baseCurrency}&symbols=${symbol}&start_date=${from}&end_date=${to}`

    const { data } = await axios.get(url)

    const result = data as ExchangeRateHostHistoryData
    return Object.entries(result.rates).reduce<HistoryData[]>(
      (acc, [formattedDate, ratesObject]) => {
        const date = dayjs(formattedDate, 'YYYY-MM-DD').startOf('day').valueOf()
        if (!isValidDate(date)) {
          console.error('ExchangeRateHost fiat history data has invalid date')
          return acc
        }
        const price = bnOrZero(ratesObject[symbol])
        if (price.isNaN()) {
          console.error('ExchangeRateHost fiat history data has invalid price')
          return acc
        }
        // add to beginning of the array because api results are sorted incrementally
        acc.unshift({
          date,
          price: price.toNumber()
        })
        return acc
      },
      []
    )
  } catch (e) {
    console.warn(e)
    throw new Error('ExchangeRateHost(findPriceHistoryByFiatSymbol): error fetching price history')
  }
}
