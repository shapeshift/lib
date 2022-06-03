import { HistoryTimeframe } from '@shapeshiftoss/types'

import { CoinGeckoMarketService } from './coingecko/coingecko'
import {
  mockCGFindAllData,
  mockCGFindByAssetIdData,
  mockCGPriceHistoryData
} from './coingecko/coingeckoMockData'
import { mockFoxyMarketData, mockFoxyPriceHistoryData } from './foxy/foxyMockData'
import { MarketServiceManager } from './market-service-manager'
import {
  mockOsmosisFindAllData,
  mockOsmosisFindByAssetId,
  mockOsmosisYearlyHistoryData
} from './osmosis/osmosisMockData'
import {
  mockYearnFindByAssetIdData,
  mockYearnPriceHistoryData,
  mockYearnServiceFindAllData
} from './yearn/yearnMockData'

const coingeckoFindAllMock = jest.fn().mockImplementation(() => mockCGFindAllData)
const coingeckoFindByAssetIdMock = jest.fn().mockImplementation(() => mockCGFindByAssetIdData)

jest.mock('./coingecko/coingecko', () => ({
  CoinGeckoMarketService: jest.fn().mockImplementation(() => ({
    findAll: coingeckoFindAllMock,
    findByAssetId: coingeckoFindByAssetIdMock,
    findPriceHistoryByAssetId: jest.fn(() => mockCGPriceHistoryData)
  }))
}))

const coingeckoMock = jest.mocked(CoinGeckoMarketService, true)

const coincapFindAllMock = jest.fn().mockImplementation(() => mockCGFindAllData)
const coincapFindByAssetIdMock = jest.fn().mockImplementation(() => mockCGFindByAssetIdData)

jest.mock('./coincap/coincap', () => ({
  CoinCapMarketService: jest.fn().mockImplementation(() => {
    return {
      findAll: coincapFindAllMock,
      findByAssetId: coincapFindByAssetIdMock,
      findPriceHistoryByAssetId: jest.fn(() => mockYearnPriceHistoryData)
    }
  })
}))

const yearnVaultFindAllMock = jest.fn().mockImplementation(() => mockYearnServiceFindAllData)
const yearnVaultFindByAssetIdMock = jest.fn().mockImplementation(() => mockYearnFindByAssetIdData)

jest.mock('./yearn/yearn-vaults', () => ({
  YearnVaultMarketCapService: jest.fn().mockImplementation(() => {
    return {
      findAll: yearnVaultFindAllMock,
      findByAssetId: yearnVaultFindByAssetIdMock,
      findPriceHistoryByAssetId: jest.fn(() => mockYearnPriceHistoryData)
    }
  })
}))

const yearnTokenFindAllMock = jest.fn().mockImplementation(() => mockYearnServiceFindAllData)
const yearnTokenFindByAssetIdMock = jest.fn().mockImplementation(() => mockYearnFindByAssetIdData)

jest.mock('./yearn/yearn-tokens', () => ({
  YearnTokenMarketCapService: jest.fn().mockImplementation(() => {
    return {
      findAll: yearnTokenFindAllMock,
      findByAssetId: yearnTokenFindByAssetIdMock,
      findPriceHistoryByAssetId: jest.fn(() => mockYearnPriceHistoryData)
    }
  })
}))

const osmosisFindAllMock = jest.fn().mockImplementation(() => mockOsmosisFindAllData)
const osmosisFindByAssetIdMock = jest.fn().mockImplementation(() => mockOsmosisFindByAssetId)

jest.mock('./osmosis/osmosis', () => ({
  OsmosisMarketService: jest.fn().mockImplementation(() => {
    return {
      findAll: osmosisFindAllMock,
      findByAssetId: osmosisFindByAssetIdMock,
      findPriceHistoryByAssetId: jest.fn(() => mockOsmosisYearlyHistoryData)
    }
  })
}))

const foxyFindAllMock = jest.fn().mockImplementation(() => mockFoxyMarketData)
const foxyFindByAssetIdMock = jest.fn().mockImplementation(() => mockFoxyMarketData)

jest.mock('./foxy/foxy', () => ({
  FoxyMarketService: jest.fn().mockImplementation(() => {
    return {
      findAll: foxyFindAllMock,
      findByAssetId: foxyFindByAssetIdMock,
      findPriceHistoryByAssetId: jest.fn(() => mockFoxyPriceHistoryData)
    }
  })
}))

jest.mock('@yfi/sdk')

describe('market service', () => {
  const marketServiceManagerArgs = {
    coinGeckoAPIKey: 'dummyCoingeckoApiKey',
    yearnChainReference: 1 as const,
    jsonRpcProviderUrl: ''
  }
  describe('findAll', () => {
    beforeAll(() => {
      jest.spyOn(console, 'info').mockImplementation()
    })

    afterAll(() => {
      jest.restoreAllMocks()
    })

    it('can return from first market service and skip the next', async () => {
      const marketServiceManager = new MarketServiceManager(marketServiceManagerArgs)
      const findAllArgs = { count: Number() }
      await marketServiceManager.findAll(findAllArgs)
      expect(coingeckoMock).toBeCalledWith({ apiKey: 'dummyCoingeckoApiKey' }) // constructor
      expect(coingeckoFindAllMock).toBeCalledWith(findAllArgs) // this should return data
      expect(coincapFindAllMock).not.toBeCalled() // and the next provider should not be called
    })

    it('can call the next market service if the first fails', async () => {
      const marketServiceManager = new MarketServiceManager(marketServiceManagerArgs)
      coingeckoFindAllMock.mockRejectedValueOnce({ error: 'error' })
      const findAllArgs = { count: Number() }
      const result = await marketServiceManager.findAll(findAllArgs)
      expect(coingeckoFindAllMock).toBeCalledWith(findAllArgs) // this will mock error
      expect(coincapFindAllMock).toBeCalledWith(findAllArgs) // this will return
      expect(result).toEqual(mockCGFindAllData)
    })

    it('errors if no data found', async () => {
      const marketServiceManager = new MarketServiceManager(marketServiceManagerArgs)
      coingeckoFindAllMock.mockRejectedValueOnce({ error: 'error' })
      coincapFindAllMock.mockRejectedValueOnce({ error: 'error' })
      yearnVaultFindAllMock.mockRejectedValueOnce({ error: 'error' })
      yearnTokenFindAllMock.mockRejectedValueOnce({ error: 'error' })
      osmosisFindAllMock.mockRejectedValueOnce({ error: 'error' })
      foxyFindAllMock.mockRejectedValueOnce({ error: 'error' })
      await expect(marketServiceManager.findAll({ count: Number() })).rejects.toEqual(
        new Error('Cannot find market service provider for market data.')
      )
    })

    it('returns market service data if exists', async () => {
      const marketServiceManager = new MarketServiceManager(marketServiceManagerArgs)
      const result = await marketServiceManager.findAll({ count: Number() })
      expect(result).toEqual(mockCGFindAllData)
    })

    it('returns next market service data if previous data does not exist', async () => {
      coingeckoFindAllMock.mockRejectedValueOnce({ error: 'error' })
      coincapFindAllMock.mockRejectedValueOnce({ error: 'error' })
      const marketServiceManager = new MarketServiceManager(marketServiceManagerArgs)
      const result = await marketServiceManager.findAll({ count: Number() })
      expect(result).toEqual(mockYearnServiceFindAllData)
    })
  })

  describe('findByAssetId', () => {
    const args = { assetId: 'eip155:1/slip44:60' }

    it('can return from first market service and skip the next', async () => {
      const marketServiceManager = new MarketServiceManager(marketServiceManagerArgs)
      const result = await marketServiceManager.findByAssetId(args)
      expect(result).toEqual(mockCGFindByAssetIdData)
    })

    it('can return from next market service if first is not found', async () => {
      coingeckoFindByAssetIdMock.mockRejectedValueOnce({ error: 'error' })
      coincapFindByAssetIdMock.mockRejectedValueOnce({ error: 'error' })
      const marketServiceManager = new MarketServiceManager(marketServiceManagerArgs)
      const result = await marketServiceManager.findByAssetId(args)
      expect(result).toEqual(mockYearnFindByAssetIdData)
    })

    it('can return null if no data found', async () => {
      coingeckoFindByAssetIdMock.mockRejectedValueOnce({ error: 'error' })
      coincapFindByAssetIdMock.mockRejectedValueOnce({ error: 'error' })
      yearnVaultFindByAssetIdMock.mockRejectedValueOnce({ error: 'error' })
      yearnTokenFindByAssetIdMock.mockRejectedValueOnce({ error: 'error' })
      osmosisFindByAssetIdMock.mockRejectedValueOnce({ error: 'error' })
      foxyFindByAssetIdMock.mockRejectedValueOnce({ error: 'error' })
      const marketServiceManager = new MarketServiceManager(marketServiceManagerArgs)
      const result = await marketServiceManager.findByAssetId(args)
      expect(result).toBeNull()
    })
  })

  describe('findPriceHistoryByAssetId', () => {
    const findPriceHistoryByAssetIdArgs = {
      assetId: 'eip155:1/slip44:60',
      timeframe: HistoryTimeframe.HOUR
    }

    it('can return from first market service and skip the next', async () => {
      const marketServiceManager = new MarketServiceManager(marketServiceManagerArgs)
      const result = await marketServiceManager.findPriceHistoryByAssetId(
        findPriceHistoryByAssetIdArgs
      )
      expect(result).toEqual(mockCGPriceHistoryData)
    })
    // it('can return from the next market service if the first is not found', async () => {
    //   MarketProviders[0].findPriceHistoryByAssetId.mockRejectedValueOnce({ error: 'error' })
    //   MarketProviders[1].findPriceHistoryByAssetId.mockRejectedValueOnce({ error: 'error' })
    //   const result = await marketServiceManager.findPriceHistoryByAssetId(
    //     findPriceHistoryByAssetIdArgs
    //   )
    //   expect(result).toEqual(mockYearnPriceHistoryData)
    // })
    // it('can return null if no data found', async () => {
    //   MarketProviders[0].findPriceHistoryByAssetId.mockRejectedValueOnce({ error: 'error' })
    //   MarketProviders[1].findPriceHistoryByAssetId.mockRejectedValueOnce({ error: 'error' })
    //   MarketProviders[2].findPriceHistoryByAssetId.mockRejectedValueOnce({ error: 'error' })
    //   MarketProviders[3].findPriceHistoryByAssetId.mockRejectedValueOnce({ error: 'error' })
    //   MarketProviders[4].findPriceHistoryByAssetId.mockRejectedValueOnce({ error: 'error' })
    //   MarketProviders[5].findPriceHistoryByAssetId.mockRejectedValueOnce({ error: 'error' })
    //   const result = await marketServiceManager.findPriceHistoryByAssetId(
    //     findPriceHistoryByAssetIdArgs
    //   )
    //   expect(result).toEqual([])
    // })
  })
})
