import { Asset, AssetDataSource, BaseAsset } from '@shapeshiftoss/types'

export const ETHMockedAsset: BaseAsset = {
  assetId: 'eip155:1/slip44:60',
  dataSource: AssetDataSource.CoinGecko,
  symbol: 'ETH',
  name: 'Ethereum',
  precision: 18,
  slip44: 60,
  color: '#FFFFFF',
  secondaryColor: '#FFFFFF',
  icon: 'https://assets.coincap.io/assets/icons/eth@2x.png',
  explorer: 'https://etherscan.io',
  explorerTxLink: 'https://etherscan.io/tx/',
  explorerAddressLink: 'https://etherscan.io/address/',
  sendSupport: true,
  receiveSupport: true,
  tokens: [
    {
      assetId: 'eip155:1/erc20:0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
      name: 'Aave',
      precision: 18,
      color: '#FFFFFF',
      dataSource: AssetDataSource.CoinGecko,
      secondaryColor: '#FFFFFF',
      icon: 'https://assets.coingecko.com/coins/images/12645/thumb/AAVE.png?1601374110',
      sendSupport: true,
      receiveSupport: true,
      symbol: 'AAVE'
    },
    {
      assetId: 'eip155:1/erc20:0xc770eefad204b5180df6a14ee197d99d808ee52d',
      name: 'Fox',
      precision: 18,
      color: '#FFFFFF',
      dataSource: AssetDataSource.CoinGecko,
      secondaryColor: '#FFFFFF',
      icon: 'https://assets.coincap.io/assets/icons/fox@2x.png',
      sendSupport: true,
      receiveSupport: true,
      symbol: 'FOX'
    }
  ]
}

export const BTCMockedAsset: BaseAsset = {
  assetId: 'bip122:000000000019d6689c085ae165831e93/slip44:0',
  dataSource: AssetDataSource.CoinGecko,
  symbol: 'BTC',
  name: 'Bitcoin',
  precision: 8,
  slip44: 0,
  color: '#FFFFFF',
  secondaryColor: '#FFFFFF',
  icon: 'https://assets.coincap.io/assets/icons/btc@2x.png',
  explorer: 'https://live.blockcypher.com',
  explorerTxLink: 'https://live.blockcypher.com/btc/tx/',
  explorerAddressLink: 'https://live.blockcypher.com/btc/address/',
  sendSupport: false,
  receiveSupport: false
}

export const mockBaseAssets: BaseAsset[] = [
  ETHMockedAsset,
  {
    assetId: 'eip155:3/slip44:60',
    dataSource: AssetDataSource.CoinGecko,
    symbol: 'ETH',
    name: 'Ethereum',
    precision: 18,
    slip44: 60,
    color: '#FFFFFF',
    secondaryColor: '#FFFFFF',
    icon: 'https://assets.coincap.io/assets/icons/eth@2x.png',
    explorer: 'https://etherscan.io',
    explorerTxLink: 'https://etherscan.io/tx/',
    explorerAddressLink: 'https://etherscan.io/address/',
    sendSupport: true,
    receiveSupport: true,
    tokens: [
      {
        assetId: 'eip155:3/erc20:0xc770eefad204b5180df6a14ee197d99d808ee52d',
        name: 'Fox',
        precision: 18,
        color: '#FFFFFF',
        secondaryColor: '#FFFFFF',
        dataSource: AssetDataSource.CoinGecko,
        icon: 'https://assets.coincap.io/assets/icons/fox@2x.png',
        sendSupport: true,
        receiveSupport: true,
        symbol: 'FOX'
      }
    ]
  },
  BTCMockedAsset,
  {
    assetId: 'bip122:000000000933ea01ad0ee984209779ba/slip44:0',
    dataSource: AssetDataSource.CoinGecko,
    symbol: 'BTC',
    name: 'Bitcoin',
    precision: 8,
    slip44: 1,
    color: '#FFFFFF',
    secondaryColor: '#FFFFFF',
    icon: 'https://assets.coincap.io/assets/icons/btc@2x.png',
    explorer: 'https://live.blockcypher.com/btc-testnet/',
    explorerTxLink: 'https://live.blockcypher.com/btc-testnet/tx/',
    explorerAddressLink: 'https://live.blockcypher.com/btc-testnet/address/',
    sendSupport: false,
    receiveSupport: false
  }
]

export const mockAssets: Asset[] = [
  {
    assetId: 'eip155:1/slip44:60',
    dataSource: AssetDataSource.CoinGecko,
    symbol: 'ETH',
    name: 'Ethereum',
    precision: 18,
    slip44: 60,
    color: '#FFFFFF',
    secondaryColor: '#FFFFFF',
    icon: 'https://assets.coincap.io/assets/icons/eth@2x.png',
    explorer: 'https://etherscan.io',
    explorerTxLink: 'https://etherscan.io/tx/',
    explorerAddressLink: 'https://etherscan.io/address/',
    sendSupport: true,
    receiveSupport: true
  },
  {
    assetId: 'eip155:1/erc20:0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
    name: 'Aave',
    precision: 18,
    color: '#FFFFFF',
    dataSource: AssetDataSource.CoinGecko,
    secondaryColor: '#FFFFFF',
    icon: 'https://assets.coingecko.com/coins/images/12645/thumb/AAVE.png?1601374110',
    sendSupport: true,
    receiveSupport: true,
    symbol: 'AAVE',
    slip44: 60,
    explorer: 'https://etherscan.io',
    explorerTxLink: 'https://etherscan.io/tx/',
    explorerAddressLink: 'https://etherscan.io/address/'
  },
  {
    assetId: 'eip155:1/erc20:0xc770eefad204b5180df6a14ee197d99d808ee52d',
    name: 'Fox',
    precision: 18,
    dataSource: AssetDataSource.CoinGecko,
    color: '#FFFFFF',
    secondaryColor: '#FFFFFF',
    icon: 'https://assets.coincap.io/assets/icons/fox@2x.png',
    sendSupport: true,
    receiveSupport: true,
    symbol: 'FOX',
    slip44: 60,
    explorer: 'https://etherscan.io',
    explorerTxLink: 'https://etherscan.io/tx/',
    explorerAddressLink: 'https://etherscan.io/address/'
  },
  {
    assetId: 'eip155:3/slip44:60',
    dataSource: AssetDataSource.CoinGecko,
    symbol: 'ETH',
    name: 'Ethereum',
    precision: 18,
    slip44: 60,
    color: '#FFFFFF',
    secondaryColor: '#FFFFFF',
    icon: 'https://assets.coincap.io/assets/icons/eth@2x.png',
    explorer: 'https://etherscan.io',
    explorerTxLink: 'https://etherscan.io/tx/',
    explorerAddressLink: 'https://etherscan.io/address/',
    sendSupport: true,
    receiveSupport: true
  },
  {
    assetId: 'eip155:3/erc20:0xc770eefad204b5180df6a14ee197d99d808ee52d',
    name: 'Fox',
    precision: 18,
    dataSource: AssetDataSource.CoinGecko,
    color: '#FFFFFF',
    secondaryColor: '#FFFFFF',
    icon: 'https://assets.coincap.io/assets/icons/fox@2x.png',
    sendSupport: true,
    receiveSupport: true,
    symbol: 'FOX',
    slip44: 60,
    explorer: 'https://etherscan.io',
    explorerTxLink: 'https://etherscan.io/tx/',
    explorerAddressLink: 'https://etherscan.io/address/'
  },
  {
    assetId: 'bip122:000000000019d6689c085ae165831e93/slip44:0',
    dataSource: AssetDataSource.CoinGecko,
    symbol: 'BTC',
    name: 'Bitcoin',
    precision: 8,
    slip44: 0,
    color: '#FFFFFF',
    secondaryColor: '#FFFFFF',
    icon: 'https://assets.coincap.io/assets/icons/btc@2x.png',
    explorer: 'https://live.blockcypher.com',
    explorerTxLink: 'https://live.blockcypher.com/btc/tx/',
    explorerAddressLink: 'https://live.blockcypher.com/btc/address/',
    sendSupport: false,
    receiveSupport: false
  },
  {
    assetId: 'bip122:000000000933ea01ad0ee984209779ba/slip44:0',
    dataSource: AssetDataSource.CoinGecko,
    symbol: 'BTC',
    name: 'Bitcoin',
    precision: 8,
    slip44: 1,
    color: '#FFFFFF',
    secondaryColor: '#FFFFFF',
    icon: 'https://assets.coincap.io/assets/icons/btc@2x.png',
    explorer: 'https://live.blockcypher.com/btc-testnet/',
    explorerTxLink: 'https://live.blockcypher.com/btc-testnet/tx/',
    explorerAddressLink: 'https://live.blockcypher.com/btc-testnet/address/',
    sendSupport: false,
    receiveSupport: false
  }
]
