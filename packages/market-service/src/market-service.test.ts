import { HistoryTimeframe } from '@shapeshiftoss/types'

import {
  mockCGFindAllData,
  mockCGFindByCaip19Data,
  mockCGPriceHistoryData
} from './coingecko/coingeckoMockData'
import { __test__, findAll, findByCaip19, findPriceHistoryByCaip19 } from './index'
import {
  mockYearnFindByCaip19Data,
  mockYearnPriceHistoryData,
  mockYearnServiceFindAllData
} from './yearn/yearnMockData'

const { MarketProviders } = __test__

jest.mock('./coingecko/coingecko', () => ({
  CoinGeckoMarketService: jest.fn().mockImplementation(() => {
    return {
      findAll: jest.fn(() => mockCGFindAllData),
      findByCaip19: jest.fn(() => mockCGFindByCaip19Data),
      findPriceHistoryByCaip19: jest.fn(() => mockCGPriceHistoryData)
    }
  })
}))

jest.mock('./yearn/yearn', () => ({
  YearnMarketCapService: jest.fn().mockImplementation(() => {
    return {
      findAll: jest.fn(() => mockYearnServiceFindAllData),
      findByCaip19: jest.fn(() => mockYearnFindByCaip19Data),
      findPriceHistoryByCaip19: jest.fn(() => mockYearnPriceHistoryData)
    }
  })
}))

jest.mock('@yfi/sdk')

// const mockedYearnSdk = jest.fn(() => ({
//   vaults: {
//     get: jest.fn((addresses) => {
//       return addresses
//         ? mockYearnRestData.filter((datum) => addresses.includes(datum.address))
//         : mockYearnRestData
//     })
//   },
//   services: {
//     subgraph: {
//       fetchQuery: jest.fn(() => mockYearnGQLData)
//     }
//   }
// }))()

// const mockedCGService = CoinGeckoMarketService as jest.Mocked<typeof CoinGeckoMarketService>
// const mockedYearnService = CoinGeckoMarketService as jest.Mocked<typeof CoinGeckoMarketService>

// const coinGeckoMarkeService = new CoinGeckoMarketService()
// // @ts-ignore
// const yearnMarkeService = new YearnMarketCapService({ yearnSdk: mockedYearnSdk })

describe('coingecko market service', () => {
  describe('findAll', () => {
    it('can return from coingecko and skip yearn', async () => {
      await findAll()
      expect(MarketProviders[0].findAll).toHaveBeenCalledTimes(1)
      expect(MarketProviders[1].findAll).toHaveBeenCalledTimes(0)
    })
    it('can call yearn if coingecko fails', async () => {
      // @ts-ignore
      MarketProviders[0].findAll.mockRejectedValueOnce({ error: 'error' })
      await findAll()
      expect(MarketProviders[1].findAll).toHaveBeenCalledTimes(1)
    })
    it('errors if no data found', async () => {
      // @ts-ignore
      MarketProviders[0].findAll.mockRejectedValueOnce({ error: 'error' })
      // @ts-ignore
      MarketProviders[1].findAll.mockRejectedValueOnce({ error: 'error' })
      await expect(findAll()).rejects.toEqual(
        new Error('Cannot find market service provider for market data.')
      )
    })
    it('returns coingecko data if exists', async () => {
      const result = await findAll()
      expect(result).toEqual(mockCGFindAllData)
    })
    it('returns yearn data if coingecko does not exist', async () => {
      // @ts-ignore
      MarketProviders[0].findAll.mockRejectedValueOnce({ error: 'error' })
      const result = await findAll()
      expect(result).toEqual(mockYearnServiceFindAllData)
    })
  })

  describe('findByCaip19', () => {
    const args = {
      caip19: 'eip155:1/slip44:60'
    }
    it('can return from coingecko and skip yearn', async () => {
      const result = await findByCaip19(args)
      expect(result).toEqual(mockCGFindByCaip19Data)
    })
    it('can return from yearn if coingecko is not found', async () => {
      // @ts-ignore
      MarketProviders[0].findByCaip19.mockRejectedValueOnce({ error: 'error' })
      const result = await findByCaip19(args)
      expect(result).toEqual(mockYearnFindByCaip19Data)
    })
    it('can return null if no data found', async () => {
      // @ts-ignore
      MarketProviders[0].findByCaip19.mockRejectedValueOnce({ error: 'error' })
      // @ts-ignore
      MarketProviders[1].findByCaip19.mockRejectedValueOnce({ error: 'error' })
      const result = await findByCaip19(args)
      expect(result).toBeNull()
    })
  })

  describe('findPriceHistoryByCaip19', () => {
    const args = {
      caip19: 'eip155:1/slip44:60',
      timeframe: HistoryTimeframe.HOUR
    }
    it('can return from coingecko and skip yearn', async () => {
      const result = await findPriceHistoryByCaip19(args)
      expect(result).toEqual(mockCGPriceHistoryData)
    })
    it('can return from yearn if coingecko is not found', async () => {
      // @ts-ignore
      MarketProviders[0].findPriceHistoryByCaip19.mockRejectedValueOnce({ error: 'error' })
      const result = await findPriceHistoryByCaip19(args)
      expect(result).toEqual(mockYearnPriceHistoryData)
    })
    it('can return null if no data found', async () => {
      // @ts-ignore
      MarketProviders[0].findPriceHistoryByCaip19.mockRejectedValueOnce({ error: 'error' })
      // @ts-ignore
      MarketProviders[1].findPriceHistoryByCaip19.mockRejectedValueOnce({ error: 'error' })
      const result = await findPriceHistoryByCaip19(args)
      expect(result).toEqual([])
    })
  })
})
