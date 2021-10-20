import axios from 'axios'
import { assetService, ChainTypes, NetworkTypes } from '@shapeshiftoss/types'
import { AssetService, flattenAssetData, indexAssetData } from './AssetService'
import { mockAssetData, mockAssets, mockIndexedAssetData } from './AssetServiceTestData'

jest.mock('axios')

const mockedAxios = axios as jest.Mocked<typeof axios>

describe('AssetService', () => {
  const assetFileUrl = 'http://example.com'
  describe('utilities', () => {
    describe('flattenAssetData', () => {
      it('should flatten data correctly', () => {
        expect(flattenAssetData(mockAssetData)).toEqual(mockAssets)
      })
    })
    describe('indexAssetData', () => {
      it('should index data correctly', () => {
        expect(indexAssetData(flattenAssetData(mockAssetData))).toEqual(mockIndexedAssetData)
      })
    })
  })

  describe('byNetwork', () => {
    it('should throw if not initialized', () => {
      const service = new AssetService(assetFileUrl)
      mockedAxios.get.mockResolvedValue({ data: mockAssetData })
      expect(() => service.byNetwork(NetworkTypes.MAINNET)).toThrow(Error)
    })

    it('should return assets by network', async () => {
      const service = new AssetService(assetFileUrl)
      mockedAxios.get.mockResolvedValue({ data: mockAssetData })
      await service.initialize()
      const ethAssets = service.byNetwork(NetworkTypes.MAINNET)
      expect(ethAssets).toEqual(
        Object.values(mockIndexedAssetData).filter(
          (a: assetService.Asset) => a.network === NetworkTypes.MAINNET
        )
      )
    })

    it('should return assets from all networks', async () => {
      const service = new AssetService(assetFileUrl)
      mockedAxios.get.mockResolvedValue({ data: mockAssetData })
      await service.initialize()
      const ethAssets = service.byNetwork()
      expect(ethAssets).toEqual(Object.values(mockIndexedAssetData))
    })
  })

  describe('byTokenId', () => {
    const tokenId = '0xc770eefad204b5180df6a14ee197d99d808ee52d'
    it('should throw if not initialized', () => {
      const service = new AssetService(assetFileUrl)
      mockedAxios.get.mockResolvedValue({ data: mockAssetData })
      const chain = ChainTypes.Ethereum
      const network = NetworkTypes.MAINNET
      const args = { chain, network, tokenId }
      expect(() => service.byTokenId(args)).toThrow(Error)
    })

    it('should return base asset for chain given no tokenId', async () => {
      const service = new AssetService(assetFileUrl)
      mockedAxios.get.mockResolvedValue({ data: mockAssetData })
      await service.initialize()
      const chain = ChainTypes.Ethereum
      const network = NetworkTypes.MAINNET
      const args = { chain, network }
      expect(service.byTokenId(args)).toEqual(
        Object.values(mockIndexedAssetData).find(
          ({ name, network: assetNetwork }: assetService.Asset) =>
            name === 'Ethereum' && assetNetwork === NetworkTypes.MAINNET
        )
      )
    })

    it(`should return FOX on ${NetworkTypes.TESTNET} when specified`, async () => {
      const service = new AssetService(assetFileUrl)
      mockedAxios.get.mockResolvedValue({ data: mockAssetData })
      await service.initialize()
      const chain = ChainTypes.Ethereum
      const network = NetworkTypes.TESTNET
      const args = { chain, network, tokenId }
      expect(service.byTokenId(args)).toEqual(
        Object.values(mockIndexedAssetData).find(
          ({ tokenId: assetTokenId, network: assetNetwork }: assetService.Asset) =>
            assetTokenId === tokenId && assetNetwork === NetworkTypes.TESTNET
        )
      )
    })

    it(`should return FOX on ${NetworkTypes.MAINNET} when specified`, async () => {
      const service = new AssetService(assetFileUrl)
      mockedAxios.get.mockResolvedValue({ data: mockAssetData })
      await service.initialize()
      const chain = ChainTypes.Ethereum
      const network = NetworkTypes.MAINNET
      const args = { chain, network, tokenId }
      expect(service.byTokenId(args)).toEqual(
        Object.values(mockIndexedAssetData).find(
          ({ tokenId: assetTokenId, network: assetNetwork }: assetService.Asset) =>
            assetTokenId === tokenId && assetNetwork === NetworkTypes.MAINNET
        )
      )
    })
  })

  describe('description', () => {
    it('should return a string if found', async () => {
      const service = new AssetService(assetFileUrl)
      const description = { en: 'a blue fox' }
      mockedAxios.get.mockResolvedValue({ data: { description } })
      await expect(service.description(ChainTypes.Ethereum, '')).resolves.toEqual(description.en)
    })

    it('should throw if not found', async () => {
      const service = new AssetService(assetFileUrl)
      mockedAxios.get.mockRejectedValue({ data: null })
      const chain = ChainTypes.Ethereum
      const tokenId = 'fooo'
      const expectedErrorMessage = `AssetService:description: no description availble for ${tokenId} on chain ${chain}`
      await expect(service.description(chain, tokenId)).rejects.toEqual(
        new Error(expectedErrorMessage)
      )
    })
  })
})
