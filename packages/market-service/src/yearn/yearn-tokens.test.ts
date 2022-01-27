import { toCAIP19 } from '@shapeshiftoss/caip/dist/caip19/caip19'
import { ChainTypes, ContractTypes, NetworkTypes } from '@shapeshiftoss/types'

import { YearnTokenMarketCapService } from './yearn-tokens'
import { mockYearnTokenRestData } from './yearnMockData'

jest.mock('@yfi/sdk')

const mockedYearnSdk = jest.fn(() => ({
  vaults: {
    tokens: jest.fn(() => {
      return mockYearnTokenRestData
    })
  },
  ironBank: {
    tokens: jest.fn(() => {
      return mockYearnTokenRestData
    })
  },
  tokens: {
    supported: jest.fn(() => {
      return mockYearnTokenRestData
    })
  }
}))()

// @ts-ignore
const yearnTokenMarketCapService = new YearnTokenMarketCapService({ yearnSdk: mockedYearnSdk })

describe('yearn token market service', () => {
  describe('findAll', () => {
    it('can flatten multiple responses', async () => {
      const result = await yearnTokenMarketCapService.findAll()
      expect(Object.keys(result).length).toEqual(2)
    })

    it('can handle api errors', async () => {
      mockedYearnSdk.vaults.tokens.mockResolvedValueOnce({ error: 'foo' } as never)
      mockedYearnSdk.tokens.supported.mockResolvedValueOnce({ error: 'foo' } as never)
      mockedYearnSdk.ironBank.tokens.mockResolvedValueOnce({ error: 'foo' } as never)
      const result = await yearnTokenMarketCapService.findAll()
      expect(Object.keys(result).length).toEqual(0)
    })

    it('can handle rate limiting', async () => {
      mockedYearnSdk.vaults.tokens.mockResolvedValueOnce({ status: 429 } as never)
      mockedYearnSdk.tokens.supported.mockResolvedValueOnce({ status: 429 } as never)
      mockedYearnSdk.ironBank.tokens.mockResolvedValueOnce({ status: 429 } as never)
      const result = await yearnTokenMarketCapService.findAll()
      expect(Object.keys(result).length).toEqual(0)
    })

    it('can use default args', async () => {
      await yearnTokenMarketCapService.findAll()
      expect(mockedYearnSdk.vaults.tokens).toHaveBeenCalledTimes(1)
      expect(mockedYearnSdk.ironBank.tokens).toHaveBeenCalledTimes(1)
      expect(mockedYearnSdk.tokens.supported).toHaveBeenCalledTimes(1)
    })

    it('can use override args', async () => {
      const count = 1
      const result = await yearnTokenMarketCapService.findAll({ count })
      expect(mockedYearnSdk.vaults.tokens).toHaveBeenCalledTimes(1)
      expect(mockedYearnSdk.ironBank.tokens).toHaveBeenCalledTimes(1)
      expect(mockedYearnSdk.tokens.supported).toHaveBeenCalledTimes(1)
      expect(Object.keys(result).length).toEqual(1)
    })

    it('can map yearn to caip ids', async () => {
      const result = await yearnTokenMarketCapService.findAll()
      const yvBtcCaip19 = toCAIP19({
        chain: ChainTypes.Ethereum,
        network: NetworkTypes.MAINNET,
        contractType: ContractTypes.ERC20,
        tokenId: mockYearnTokenRestData[0].address.toLowerCase()
      })
      const yvDaiCaip19 = toCAIP19({
        chain: ChainTypes.Ethereum,
        network: NetworkTypes.MAINNET,
        contractType: ContractTypes.ERC20,
        tokenId: mockYearnTokenRestData[1].address.toLowerCase()
      })
      const [yvBtcKey, yvDaiKey] = Object.keys(result)
      console.log({ result })
      expect(yvDaiKey).toEqual(yvDaiCaip19)
      expect(yvBtcKey).toEqual(yvBtcCaip19)
    })
  })

  describe('findByCaip19', () => {
    const args = {
      caip19: 'eip155:1/erc20:0x19d3364a399d251e894ac732651be8b0e4e85001' // yvDai
    }
    it('should return market data for yvDai', async () => {
      const result = {
        price: '0.99',
        marketCap: '0',
        changePercent24Hr: 0,
        volume: '0'
      }
      expect(await yearnTokenMarketCapService.findByCaip19(args)).toEqual(result)
    })

    it('should return null on network error', async () => {
      mockedYearnSdk.vaults.tokens.mockRejectedValueOnce(Error as never)
      mockedYearnSdk.ironBank.tokens.mockRejectedValueOnce(Error as never)
      mockedYearnSdk.tokens.supported.mockRejectedValueOnce(Error as never)
      jest.spyOn(console, 'warn').mockImplementation(() => void 0)
      expect(await yearnTokenMarketCapService.findByCaip19(args)).toEqual(null)
    })
  })

  describe('findPriceHistoryByCaip19', () => {
    it('should return market empty array', async () => {
      const expected: [] = []
      expect(await yearnTokenMarketCapService.findPriceHistoryByCaip19()).toEqual(expected)
    })
  })
})
