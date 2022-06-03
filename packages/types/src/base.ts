/** Common */

export type BIP44Params = {
  purpose: number
  coinType: number
  accountNumber: number
  isChange?: boolean
  index?: number
}

export enum ChainTypes {
  Ethereum = 'ethereum',
  Bitcoin = 'bitcoin',
  Cosmos = 'cosmos',
  Osmosis = 'osmosis'
}

const supportedChainIds = [
  'eip155:1',
  'bip122:000000000019d6689c085ae165831e93',
  'cosmos:cosmoshub-4',
  'cosmos:osmosis-1'
] as const

// export enum SUPPORTED_CHAIN_IDS {
//   EthereumMainnet = 'eip155:1',
//   BitcoinMainnet = 'bip122:000000000019d6689c085ae165831e93',
//   CosmosMainnet = 'cosmos:cosmoshub-4',
//   OsmosisMainnet = 'cosmos:osmosis-1'
// }

export type SupportedChainIds = typeof supportedChainIds[number]

export enum NetworkTypes {
  MAINNET = 'MAINNET',
  TESTNET = 'TESTNET', // BTC, LTC, etc...
  ETH_ROPSTEN = 'ETH_ROPSTEN',
  ETH_RINKEBY = 'ETH_RINKEBY',
  COSMOSHUB_MAINNET = 'COSMOSHUB_MAINNET',
  COSMOSHUB_VEGA = 'COSMOSHUB_VEGA',
  OSMOSIS_MAINNET = 'OSMOSIS_MAINNET',
  OSMOSIS_TESTNET = 'OSMOSIS_TESTNET'
}

export enum WithdrawType {
  DELAYED,
  INSTANT
}

export enum UtxoAccountType {
  SegwitNative = 'SegwitNative',
  SegwitP2sh = 'SegwitP2sh',
  P2pkh = 'P2pkh'
}

// TODO(0xdef1cafe): remove this, client should not be aware of where data is from
// Describes the data source for where to get the asset details or asset description.
export enum AssetDataSource {
  CoinGecko = 'coingecko',
  YearnFinance = 'yearnfinance'
}

// asset-service
export type Asset = {
  assetId: string
  chainId: string
  /** @deprecated: do not use. This will be removed once consumers have handled it */
  chain: ChainTypes
  description?: string
  isTrustedDescription?: boolean
  /** @deprecated: do not use. This will be removed once consumers have handled it */
  dataSource?: AssetDataSource
  /** @deprecated: do not use. This will be removed once consumers have handled it */
  network: NetworkTypes
  symbol: string
  name: string
  precision: number
  /** @deprecated: do not use. This will be removed once consumers have handled it */
  slip44?: number
  color: string
  /** @deprecated: do not use. This will be removed once consumers have handled it */
  secondaryColor?: string
  icon: string
  explorer: string
  explorerTxLink: string
  explorerAddressLink: string
  /** @deprecated: do not use. This will be removed once consumers have handled it */
  sendSupport?: boolean
  /** @deprecated: do not use. This will be removed once consumers have handled it */
  receiveSupport?: boolean
}

// swapper
// TODO remove this once web is using the type from swapper
export enum SwapperType {
  Zrx = '0x',
  Thorchain = 'Thorchain',
  Test = 'Test'
}
