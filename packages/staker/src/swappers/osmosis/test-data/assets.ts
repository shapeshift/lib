import { Asset, AssetDataSource, ChainTypes, NetworkTypes } from '@shapeshiftoss/types'

export const ATOM: Asset = {
  assetId: 'cosmos:cosmoshub-4/slip44:118',
  chainId: 'cosmos:cosmoshub-4',
  // @ts-ignore
  caip19: 'cosmos:cosmoshub-4/slip44:118',
  caip2: 'cosmos:cosmoshub-4',
  name: 'Cosmos',
  chain: ChainTypes.Cosmos,
  dataSource: AssetDataSource.CoinGecko,
  network: NetworkTypes.MAINNET,
  precision: 6,
  slip44: 118,
  color: '#FFFFFF',
  secondaryColor: '#FFFFFF',
  icon: 'https://assets.coincap.io/assets/icons/256/atom.png',
  explorer: 'https://www.mintscan.io/cosmos',
  explorerAddressLink: 'https://www.mintscan.io/cosmos/account/',
  explorerTxLink: 'https://www.mintscan.io/cosmos/txs/',
  sendSupport: true,
  receiveSupport: true,
  symbol: 'ATOM'
}

export const OSMO: Asset = {
  assetId: 'cosmos:osmosis-1/slip44:118',
  chainId: 'cosmos:osmosis-1',
  // @ts-ignore
  caip19: 'cosmos:osmosis-1/slip44:118',
  caip2: 'cosmos:osmosis-1',
  chain: ChainTypes.Osmosis,
  dataSource: AssetDataSource.CoinGecko,
  network: NetworkTypes.MAINNET,
  symbol: 'OSMO',
  name: 'Osmosis',
  precision: 6,
  slip44: 60,
  color: '#FFFFFF',
  secondaryColor: '#FFFFFF',
  icon: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/osmosis/images/osmo.png',
  explorer: 'https://mintscan.io',
  explorerAddressLink: 'https://mintscan.io/cosmos/account',
  explorerTxLink: 'https://mintscan.io/cosmos/txs/',
  sendSupport: true,
  receiveSupport: true
}
