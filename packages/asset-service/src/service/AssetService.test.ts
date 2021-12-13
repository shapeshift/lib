import {
  Asset,
  AssetDataSource,
  ChainTypes,
  ContractTypes,
  NetworkTypes
} from '@shapeshiftoss/types'
import axios from 'axios'

import { AssetService, flattenAssetData, indexAssetData } from './AssetService'
import { mockAssets, mockBaseAssets, mockIndexedAssetData } from './AssetServiceTestData'

jest.mock('axios')

const mockedAxios = axios as jest.Mocked<typeof axios>

const EthAsset: Asset = {
  caip19: 'eip155:3/slip44:60',
  caip2: 'eip155:3',
  chain: ChainTypes.Ethereum,
  dataSource: AssetDataSource.CoinGecko,
  network: NetworkTypes.ETH_ROPSTEN,
  symbol: 'ETH',
  name: 'Ropsten Testnet Ethereum',
  precision: 18,
  slip44: 1,
  color: '#FFFFFF',
  secondaryColor: '#FFFFFF',
  icon: 'https://assets.coincap.io/assets/icons/eth@2x.png',
  explorer: 'https://ropsten.etherscan.io/',
  explorerTxLink: 'https://ropsten.etherscan.io/tx/',
  explorerAddressLink: 'https://ropsten.etherscan.io/address/',
  sendSupport: false,
  receiveSupport: false
}

describe('AssetService', () => {
  const assetFileUrl = 'http://example.com'
  describe('utilities', () => {
    describe('flattenAssetData', () => {
      it('should flatten data correctly', () => {
        expect(flattenAssetData(mockBaseAssets)).toEqual(mockAssets)
      })
    })
    describe('indexAssetData', () => {
      it('should index data correctly', () => {
        expect(indexAssetData(flattenAssetData(mockBaseAssets))).toEqual(mockIndexedAssetData)
      })
    })
  })

  describe('byNetwork', () => {
    it('should throw if not initialized', () => {
      const assetService = new AssetService(assetFileUrl)
      mockedAxios.get.mockResolvedValue({ data: mockBaseAssets })
      expect(() => assetService.byNetwork(NetworkTypes.MAINNET)).toThrow(Error)
    })

    it('should return assets by network', async () => {
      const assetService = new AssetService(assetFileUrl)
      mockedAxios.get.mockResolvedValue({ data: mockBaseAssets })
      await assetService.initialize()
      const ethAssets = assetService.byNetwork(NetworkTypes.MAINNET)
      expect(ethAssets).toEqual(
        Object.values(mockIndexedAssetData).filter((a: Asset) => a.network === NetworkTypes.MAINNET)
      )
    })

    it('should return assets from all networks', async () => {
      const assetService = new AssetService(assetFileUrl)
      mockedAxios.get.mockResolvedValue({ data: mockBaseAssets })
      await assetService.initialize()
      const ethAssets = assetService.byNetwork()
      expect(ethAssets).toEqual(Object.values(mockIndexedAssetData))
    })
  })

  describe('byTokenId', () => {
    const tokenId = '0xc770eefad204b5180df6a14ee197d99d808ee52d'
    it('should throw if not initialized', () => {
      const assetService = new AssetService(assetFileUrl)
      mockedAxios.get.mockResolvedValue({ data: mockBaseAssets })
      const chain = ChainTypes.Ethereum
      const network = NetworkTypes.MAINNET
      const args = { chain, network, tokenId }
      expect(() => assetService.byTokenId(args)).toThrow(Error)
    })

    it('should return base asset for chain given no tokenId', async () => {
      const assetService = new AssetService(assetFileUrl)
      mockedAxios.get.mockResolvedValue({ data: mockBaseAssets })
      await assetService.initialize()
      const chain = ChainTypes.Ethereum
      const network = NetworkTypes.MAINNET
      const args = { chain, network }
      expect(assetService.byTokenId(args)).toEqual(
        Object.values(mockIndexedAssetData).find(
          ({ name, network: assetNetwork }: Asset) =>
            name === 'Ethereum' && assetNetwork === NetworkTypes.MAINNET
        )
      )
    })

    it(`should return FOX on ${NetworkTypes.ETH_ROPSTEN} when specified`, async () => {
      const assetService = new AssetService(assetFileUrl)
      mockedAxios.get.mockResolvedValue({ data: mockBaseAssets })
      await assetService.initialize()
      const chain = ChainTypes.Ethereum
      const network = NetworkTypes.ETH_ROPSTEN
      const args = { chain, network, tokenId }
      expect(assetService.byTokenId(args)).toEqual(
        Object.values(mockIndexedAssetData).find(
          ({ tokenId: assetTokenId, network: assetNetwork }: Asset) =>
            assetTokenId === tokenId && assetNetwork === NetworkTypes.ETH_ROPSTEN
        )
      )
    })

    it(`should return FOX on ${NetworkTypes.MAINNET} when specified`, async () => {
      const assetService = new AssetService(assetFileUrl)
      mockedAxios.get.mockResolvedValue({ data: mockBaseAssets })
      await assetService.initialize()
      const chain = ChainTypes.Ethereum
      const network = NetworkTypes.MAINNET
      const args = { chain, network, tokenId }
      expect(assetService.byTokenId(args)).toEqual(
        Object.values(mockIndexedAssetData).find(
          ({ tokenId: assetTokenId, network: assetNetwork }: Asset) =>
            assetTokenId === tokenId && assetNetwork === NetworkTypes.MAINNET
        )
      )
    })
  })

  describe('description', () => {
    it('should return a string if found', async () => {
      const assetService = new AssetService(assetFileUrl)
      const description = { en: 'a blue fox' }
      mockedAxios.get.mockResolvedValue({ data: { description } })
      await expect(assetService.description({ asset: EthAsset })).resolves.toEqual(description.en)
    })

    it('should throw if not found', async () => {
      const assetService = new AssetService(assetFileUrl)
      mockedAxios.get.mockRejectedValue({ data: null })
      const chain = ChainTypes.Ethereum
      const tokenData = {
        caip19: 'eip155:3/erc20:0x1da00b6fc705f2ce4c25d7e7add25a3cc045e54a',
        caip2: 'eip155:3',
        chain: ChainTypes.Ethereum,
        explorer: 'https://etherscan.io',
        explorerTxLink: 'https://etherscan.io/tx/',
        explorerAddressLink: 'https://etherscan.io/address/',
        network: NetworkTypes.MAINNET,
        name: 'Test Token',
        precision: 18,
        tokenId: '0x1da00b6fc705f2ce4c25d7e7add25a3cc045e54a',
        contractType: ContractTypes.ERC20,
        color: '#FFFFFF',
        dataSource: AssetDataSource.CoinGecko,
        secondaryColor: '#FFFFFF',
        slip44: 60,
        icon: 'https://assets.coingecko.com/coins/images/17049/thumb/BUNNY.png?1626148809',
        sendSupport: true,
        receiveSupport: true,
        symbol: 'TST'
      }
      const expectedErrorMessage = `AssetService:description: no description availble for ${tokenData.tokenId} on chain ${chain}`
      await expect(
        assetService.description({
          asset: tokenData
        })
      ).rejects.toEqual(new Error(expectedErrorMessage))
    })
  })
})
