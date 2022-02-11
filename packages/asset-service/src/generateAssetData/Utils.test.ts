import {
  AssetDataSource,
  BaseAsset,
  ChainTypes,
  ContractTypes,
  NetworkTypes,
  TokenAsset
} from '@shapeshiftoss/types'

import { filterBlacklistedAssets } from './generateAssetData'

jest.mock(
  './blacklist.json',
  () => [
    'bip122:000000000019d6689c085ae165831e93/slip44:0',
    'eip155:1/erc20:0x426ca1ea2406c07d75db9585f22781c096e3d0e0'
  ],
  { virtual: true }
)

const BtcAsset: BaseAsset = {
  caip19: 'bip122:000000000019d6689c085ae165831e93/slip44:0',
  caip2: 'bip122:000000000019d6689c085ae165831e93',
  chain: ChainTypes.Bitcoin,
  dataSource: AssetDataSource.CoinGecko,
  network: NetworkTypes.MAINNET,
  symbol: 'BTC',
  name: 'Bitcoin',
  precision: 8,
  slip44: 0,
  color: '#FFFFFF',
  secondaryColor: '#FFFFFF',
  icon: 'https://assets.coincap.io/assets/icons/256/btc.png',
  explorer: 'https://live.blockcypher.com',
  explorerAddressLink: 'https://live.blockcypher.com/btc/address/',
  explorerTxLink: 'https://live.blockcypher.com/btc/tx/',
  sendSupport: false,
  receiveSupport: false
}

const MNEAsset: TokenAsset = {
  tokenId: '0x426CA1eA2406c07d75Db9585F22781c096e3d0E0',
  contractType: ContractTypes.ERC20,
  caip19: 'eip155:1/erc20:0x426ca1ea2406c07d75db9585f22781c096e3d0e0',
  caip2: 'eip155:1',
  dataSource: AssetDataSource.CoinGecko,
  symbol: 'MNE',
  name: 'Minereum',
  precision: 8,
  color: '#FFFFFF',
  secondaryColor: '#FFFFFF',
  icon: 'https://rawcdn.githack.com/trustwallet/assets/master/blockchains/ethereum/assets/0x426ca1ea2406c07d75db9585f22781c096e3d0e0/logo.png',
  sendSupport: false,
  receiveSupport: false
}

const EthAsset: BaseAsset = {
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
  receiveSupport: false,
  tokens: [MNEAsset]
}

const assetList = [EthAsset, BtcAsset, MNEAsset]

describe('Utils', () => {
  describe('filterBlacklistedAssets', () => {
    it('should filter eth from the asset list', () => {
      const filteredAssetList = filterBlacklistedAssets(assetList)
      expect(filteredAssetList).toHaveLength(1)
      const ethFiltered = <BaseAsset>filteredAssetList[0]
      expect(ethFiltered.tokens).toHaveLength(0)
    })
  })
})
