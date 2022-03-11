import { AssetNamespace } from '@shapeshiftoss/caip'
import { Asset, AssetDataSource } from '@shapeshiftoss/types'
import axios from 'axios'

import { AssetService, flattenAssetData, indexAssetData } from './AssetService'
import { mockAssets, mockBaseAssets } from './AssetServiceTestData'
import descriptions from './descriptions.json'

jest.mock('axios')

const mockedAxios = axios as jest.Mocked<typeof axios>

const EthAsset: Asset = {
  assetId: 'eip155:3/slip44:60',
  dataSource: AssetDataSource.CoinGecko,
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

jest.mock(
  './descriptions.json',
  () => ({
    'eip155:3/slip44:60': 'overridden description'
  }),
  { virtual: true }
)

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
        expect(indexAssetData(flattenAssetData(mockBaseAssets))).toMatchSnapshot()
      })
    })
  })

  describe('description', () => {
    it('should return the overridden description if it exists', async () => {
      const assetService = new AssetService(assetFileUrl)

      await expect(assetService.description({ asset: EthAsset })).resolves.toEqual({
        description: 'overridden description',
        isTrusted: true
      })
    })

    it('should return a string if found', async () => {
      const assetDescriptions = descriptions as Record<string, string>
      delete assetDescriptions[EthAsset.assetId]

      const assetService = new AssetService(assetFileUrl)
      const description = { en: 'a blue fox' }
      mockedAxios.get.mockResolvedValue({ data: { description } })
      await expect(assetService.description({ asset: EthAsset })).resolves.toEqual({
        description: description.en
      })
    })

    it('should throw if not found', async () => {
      const assetService = new AssetService(assetFileUrl)
      mockedAxios.get.mockRejectedValue({ data: null })
      const tokenData: Asset = {
        assetId: 'eip155:3/erc20:0x1da00b6fc705f2ce4c25d7e7add25a3cc045e54a',
        explorer: 'https://etherscan.io',
        explorerTxLink: 'https://etherscan.io/tx/',
        explorerAddressLink: 'https://etherscan.io/address/',
        name: 'Test Token',
        precision: 18,
        color: '#FFFFFF',
        dataSource: AssetDataSource.CoinGecko,
        secondaryColor: '#FFFFFF',
        slip44: 60,
        icon: 'https://assets.coingecko.com/coins/images/17049/thumb/BUNNY.png?1626148809',
        sendSupport: true,
        receiveSupport: true,
        symbol: 'TST'
      }
      await expect(
        assetService.description({
          asset: tokenData
        })
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        `"AssetService:description: no description available for 0x1da00b6fc705f2ce4c25d7e7add25a3cc045e54a on chain ethereum"`
      )
    })
  })
})
