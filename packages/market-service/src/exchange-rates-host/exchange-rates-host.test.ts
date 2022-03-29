import { FiatMarketDataArgs, FiatPriceHistoryArgs, HistoryTimeframe } from '@shapeshiftoss/types'
import axios from 'axios'
import dayjs from 'dayjs'

import { findByFiatSymbol, findPriceHistoryByFiatSymbol } from './exchange-rates-host'
import { ExchangeRateHostRate } from './exchange-rates-host-types'

jest.mock('axios')

const mockedAxios = axios as jest.Mocked<typeof axios>

describe('ExchangeRateHostService', () => {
  describe('findByFiatSymbol', () => {
    const args: FiatMarketDataArgs = {
      symbol: 'EUR'
    }

    const eurRate: ExchangeRateHostRate = {
      rates: {
        EUR: 0.91
      }
    }

    const mockERHFindByFiatSymbol = {
      changePercent24Hr: 0,
      marketCap: '0',
      price: '0.91',
      volume: '0'
    }

    it('should return fiat market data for EUR', async () => {
      mockedAxios.get.mockResolvedValue({ data: eurRate })
      expect(await findByFiatSymbol(args)).toEqual(mockERHFindByFiatSymbol)
    })

    it('should return null on network error', async () => {
      mockedAxios.get.mockRejectedValue(Error)
      jest.spyOn(console, 'warn').mockImplementation(() => void 0)
      await expect(findByFiatSymbol(args)).rejects.toEqual(
        new Error('FiatMarketService(findByFiatSymbol): error fetching market data')
      )
    })
  })

  describe('findPriceHistoryByFiatSymbol', () => {
    const args: FiatPriceHistoryArgs = {
      symbol: 'EUR',
      timeframe: HistoryTimeframe.WEEK
    }

    it('should return historical fiat market data for EUR', async () => {
      const mockHistoryData = {
        rates: {
          '2020-01-01': { EUR: 0.891186 },
          '2020-01-02': { EUR: 0.891186 },
          '2020-01-03': { EUR: 0.895175 },
          '2020-01-04': { EUR: 0.895175 }
        }
      }

      const mockERHPriceHistoryData = [
        { date: dayjs('2020-01-04', 'YYYY-MM-DD').startOf('day').valueOf(), price: 0.895175 },
        { date: dayjs('2020-01-03', 'YYYY-MM-DD').startOf('day').valueOf(), price: 0.895175 },
        { date: dayjs('2020-01-02', 'YYYY-MM-DD').startOf('day').valueOf(), price: 0.891186 },
        { date: dayjs('2020-01-01', 'YYYY-MM-DD').startOf('day').valueOf(), price: 0.891186 }
      ]

      mockedAxios.get.mockResolvedValue({ data: mockHistoryData })
      expect(await findPriceHistoryByFiatSymbol(args)).toEqual(mockERHPriceHistoryData)
    })

    it('should return null on network error', async () => {
      mockedAxios.get.mockRejectedValue(Error)
      jest.spyOn(console, 'warn').mockImplementation(() => void 0)
      await expect(findPriceHistoryByFiatSymbol(args)).rejects.toEqual(
        new Error('ExchangeRateHost(findPriceHistoryByFiatSymbol): error fetching price history')
      )
    })
  })
})
