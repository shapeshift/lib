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
  DogecoinMainnet = 'bip122:00000000001a91e3dace36e2be3bf030',
  CosmosMainnet = 'cosmos:cosmoshub-4',
  OsmosisMainnet = 'cosmos:osmosis-1',
  AvalancheMainnet = 'eip155:43114'
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
