/** Common */

export type BIP44Params = {
  purpose: number
  coinType: number
  accountNumber: number
  isChange?: boolean
  index?: number
}

export enum KnownChainIds {
  EthereumMainnet = 'eip155:1',
  BitcoinMainnet = 'bip122:000000000019d6689c085ae165831e93',
  CosmosMainnet = 'cosmos:cosmoshub-4',
  OsmosisMainnet = 'cosmos:osmosis-1'
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
  description?: string
  isTrustedDescription?: boolean
  symbol: string
  name: string
  precision: number
  color: string
  icon: string
  explorer: string
  explorerTxLink: string
  explorerAddressLink: string
}

// swapper
// TODO remove this once web is using the type from swapper
export enum SwapperType {
  Zrx = '0x',
  Thorchain = 'Thorchain',
  Test = 'Test'
}
