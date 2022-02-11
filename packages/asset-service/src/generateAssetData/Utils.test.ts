import { AssetDataSource, BaseAsset, ChainTypes, NetworkTypes } from '@shapeshiftoss/types'
import { filter } from 'lodash'

import { filterBlacklistedAssets } from './generateAssetData'

jest.mock('./blacklist.json', () => ['eip155:3/slip44:60'], { virtual: true })

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
  receiveSupport: false
}

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

const assetList = [EthAsset, BtcAsset]

describe('Utils', () => {
  describe('filterBlacklistedAssets', () => {
    it('should filter eth from the asset list', () => {
      expect(filter(filterBlacklistedAssets(assetList))).toHaveLength(1)
    })
  })
})
