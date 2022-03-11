// https://github.com/ChainAgnostic/CAIPs/blob/master/CAIPs/caip-2.md
import * as ta from 'type-assertions'

export type CAIP2 = string

export const WellKnownChain = Object.freeze({
  EthereumMainnet: 'eip155:1',
  EthereumRopsten: 'eip155:3',
  EthereumRinkeby: 'eip155:4',
  EthereumKovan: 'eip155:42', // currently unsupported by shapeshift
  // https://github.com/bitcoin/bips/blob/master/bip-0122.mediawiki#definition-of-chain-id
  // caip2 uses max length of 32 chars of the genesis block
  BitcoinMainnet: 'bip122:000000000019d6689c085ae165831e93',
  BitcoinTestnet: 'bip122:000000000933ea01ad0ee984209779ba',
  CosmosHubMainnet: 'cosmos:cosmoshub-4',
  CosmosHubVega: 'cosmos:vega-testnet',
  OsmosisMainnet: 'cosmos:osmosis-1',
  OsmosisTestnet: 'cosmos:osmo-testnet-1'
} as const)
export type WellKnownChain = typeof WellKnownChain[keyof typeof WellKnownChain]

ta.assert<ta.Extends<WellKnownChain, CAIP2>>()

type IsCAIP2 = (caip2: string) => caip2 is WellKnownChain

// This is a bit of a conceit; there are plenty of valid CAIP2s that we don't have
// listed, but there's not a good way to confirm an arbitrary string's chain
// reference is valid, so we refuse to validate any we don't know for sure are OK.
export const isCAIP2: IsCAIP2 = (caip2): caip2 is WellKnownChain =>
  (Object.values(WellKnownChain) as string[]).includes(caip2)
