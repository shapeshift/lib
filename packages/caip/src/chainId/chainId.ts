import { ChainReference } from '@shapeshiftoss/caip'
// https://github.com/ChainAgnostic/CAIPs/blob/master/CAIPs/caip-2.md
import { ChainTypes, NetworkTypes } from '@shapeshiftoss/types'
import invert from 'lodash/invert'

/**
 * a chain id is a combination of both ChainNamespace and ChainReference
 * e.g. 'eip155:1'
 */
export type ChainId = string

export enum ChainNamespace {
  Ethereum = 'eip155',
  Bitcoin = 'bip122',
  Cosmos = 'cosmos'
}

const namespaceStrings = (Object.keys(ChainNamespace) as Array<keyof typeof ChainNamespace>).map(
  (k) => ChainNamespace[k]
)

// people will bitch about the plurality of the type - can we avoid this/shadow the type with the same
// name as the enum???
export type ChainNamespaces = typeof namespaceStrings[number]

type C = {
  [k in ChainNamespaces]?: string
}

// ergonomically, able to use both an enum or a raw string, and they both satisfy the type constraint
// and the type is a string union, rather than a loose string
export const foo: C = {
  ['eip155']: '',
  [ChainNamespace.Bitcoin]: ''
}

export enum ChainReference {
  EthereumMainnet = '1',
  EthereumRopsten = '3',
  EthereumRinkeby = '4',
  // EthereumKovan = '42', // currently unsupported by ShapeShift
  // https://github.com/bitcoin/bips/blob/master/bip-0122.mediawiki#definition-of-chain-id
  // chainId uses max length of 32 chars of the genesis block
  BitcoinMainnet = '000000000019d6689c085ae165831e93',
  BitcoinTestnet = '000000000933ea01ad0ee984209779ba',
  CosmosHubMainnet = 'cosmoshub-4',
  CosmosHubVega = 'vega-testnet',
  OsmosisMainnet = 'osmosis-1',
  OsmosisTestnet = 'osmo-testnet-1'
}

type ToChainIdArgs = {
  chainNamespace: ChainNamespace
  chainReference: ChainReference
  // chain: ChainTypes // replaced by ChainNamespace above
  // network: NetworkTypes | ChainReference // replaced by ChainReference above
}

// this needs to be deleted from this package - caip should not contain anything shapeshift-specific
// when we're done
const shapeShiftToChainId = Object.freeze({
  [ChainTypes.Ethereum]: {
    namespace: ChainNamespace.Ethereum,
    reference: {
      [NetworkTypes.MAINNET]: ChainReference.EthereumMainnet,
      [NetworkTypes.ETH_ROPSTEN]: ChainReference.EthereumRopsten,
      [NetworkTypes.ETH_RINKEBY]: ChainReference.EthereumRinkeby
    }
  },
  [ChainTypes.Bitcoin]: {
    namespace: ChainNamespace.Bitcoin,
    reference: {
      [NetworkTypes.MAINNET]: ChainReference.BitcoinMainnet,
      [NetworkTypes.TESTNET]: ChainReference.BitcoinTestnet
    }
  },
  [ChainTypes.Cosmos]: {
    namespace: ChainNamespace.Cosmos,
    reference: {
      [NetworkTypes.COSMOSHUB_MAINNET]: ChainReference.CosmosHubMainnet,
      [NetworkTypes.COSMOSHUB_VEGA]: ChainReference.CosmosHubVega
    }
  },
  [ChainTypes.Osmosis]: {
    namespace: ChainNamespace.Cosmos,
    reference: {
      [NetworkTypes.OSMOSIS_MAINNET]: ChainReference.OsmosisMainnet,
      [NetworkTypes.OSMOSIS_TESTNET]: ChainReference.OsmosisTestnet
    }
  }
})

export const toChainId = (args: ToChainIdArgs): string => {
  const { chain, network } = args
  const namespace: ChainNamespace = shapeShiftToChainId[chain].namespace

  switch (chain) {
    case ChainTypes.Ethereum: {
      const referenceMap = shapeShiftToChainId[chain].reference
      switch (network) {
        case NetworkTypes.MAINNET:
        case NetworkTypes.ETH_ROPSTEN:
        case NetworkTypes.ETH_RINKEBY: {
          const reference: ChainReference = referenceMap[network]
          return `${namespace}:${reference}`
        }
      }
      break
    }
    case ChainTypes.Bitcoin: {
      const referenceMap = shapeShiftToChainId[chain].reference
      switch (network) {
        case NetworkTypes.MAINNET:
        case NetworkTypes.TESTNET: {
          const reference: ChainReference = referenceMap[network]
          return `${namespace}:${reference}`
        }
      }
      break
    }
    case ChainTypes.Cosmos: {
      const referenceMap = shapeShiftToChainId[chain].reference
      switch (network) {
        case NetworkTypes.COSMOSHUB_MAINNET:
        case NetworkTypes.COSMOSHUB_VEGA: {
          const reference: ChainReference = referenceMap[network]
          return `${namespace}:${reference}`
        }
      }
      break
    }
    case ChainTypes.Osmosis: {
      const referenceMap = shapeShiftToChainId[chain].reference
      switch (network) {
        case NetworkTypes.OSMOSIS_MAINNET:
        case NetworkTypes.OSMOSIS_TESTNET: {
          const reference: ChainReference = referenceMap[network]
          return `${namespace}:${reference}`
        }
      }
      break
    }
  }

  throw new Error(`toChainId: unsupported ${chain} network: ${network}`)
}

type FromChainIdReturn = {
  chainNamespace: ChainNamespace
  chainReference: ChainReference
  // chain: ChainTypes
  // network: NetworkTypes
}

type FromChainId = (chainId: ChainId) => FromChainIdReturn

export const fromChainId: FromChainId = (chainId) => {
  const [c, n] = chainId.split(':')
  if (!(c && n)) {
    throw new Error(`fromChainId: error parsing chainId, chain: ${c}, network: ${n}`)
  }
  switch (c) {
    case ChainNamespace.Cosmos: {
      switch (n) {
        case ChainReference.CosmosHubMainnet: {
          return { chain: ChainTypes.Cosmos, network: NetworkTypes.COSMOSHUB_MAINNET }
        }
        case ChainReference.CosmosHubVega: {
          return { chain: ChainTypes.Cosmos, network: NetworkTypes.COSMOSHUB_VEGA }
        }
        case ChainReference.OsmosisMainnet: {
          return { chain: ChainTypes.Osmosis, network: NetworkTypes.OSMOSIS_MAINNET }
        }
        case ChainReference.OsmosisTestnet: {
          return { chain: ChainTypes.Osmosis, network: NetworkTypes.OSMOSIS_TESTNET }
        }
        default: {
          throw new Error(`fromChainId: unsupported ${c} network: ${n}`)
        }
      }
    }

    case ChainNamespace.Ethereum: {
      const chain = ChainTypes.Ethereum
      switch (n) {
        case ChainReference.EthereumMainnet: {
          const network = NetworkTypes.MAINNET
          return { chain, network }
        }
        case ChainReference.EthereumRopsten: {
          const network = NetworkTypes.ETH_ROPSTEN
          return { chain, network }
        }
        case ChainReference.EthereumRinkeby: {
          const network = NetworkTypes.ETH_RINKEBY
          return { chain, network }
        }
        default: {
          throw new Error(`fromChainId: unsupported ${c} network: ${n}`)
        }
      }
    }
    case ChainNamespace.Bitcoin: {
      const chain = ChainTypes.Bitcoin
      switch (n) {
        case ChainReference.BitcoinMainnet: {
          const network = NetworkTypes.MAINNET
          return { chain, network }
        }
        case ChainReference.BitcoinTestnet: {
          const network = NetworkTypes.TESTNET
          return { chain, network }
        }
        default: {
          throw new Error(`fromChainId: unsupported ${c} network: ${n}`)
        }
      }
    }
  }

  throw new Error(`fromChainId: unsupported chain: ${c}`)
}

type IsChainId = (chainId: string) => boolean

export const isChainId: IsChainId = (chainId) => {
  const [c, n] = chainId.split(':')
  if (!(c && n)) {
    throw new Error(`isChainId: error parsing chainId, chain: ${c}, network: ${n}`)
  }

  switch (c) {
    case ChainNamespace.Cosmos: {
      switch (n) {
        case ChainReference.CosmosHubMainnet:
        case ChainReference.CosmosHubVega:
        case ChainReference.OsmosisMainnet:
        case ChainReference.OsmosisTestnet:
          return true
      }
      break
    }

    case ChainNamespace.Ethereum: {
      switch (n) {
        case ChainReference.EthereumMainnet:
        case ChainReference.EthereumRopsten:
        case ChainReference.EthereumRinkeby:
          return true
      }
      break
    }
    case ChainNamespace.Bitcoin: {
      switch (n) {
        case ChainReference.BitcoinMainnet:
        case ChainReference.BitcoinTestnet:
          return true
      }
      break
    }
  }

  throw new Error(`isChainId: invalid ChainId ${chainId}`)
}

export const chainReferenceToNetworkType: Record<ChainReference, NetworkTypes> = Object.freeze({
  [ChainReference.BitcoinMainnet]: NetworkTypes.MAINNET,
  [ChainReference.BitcoinTestnet]: NetworkTypes.TESTNET,
  [ChainReference.EthereumMainnet]: NetworkTypes.MAINNET,
  [ChainReference.EthereumRopsten]: NetworkTypes.ETH_ROPSTEN,
  [ChainReference.EthereumRinkeby]: NetworkTypes.ETH_RINKEBY,
  [ChainReference.CosmosHubMainnet]: NetworkTypes.COSMOSHUB_MAINNET,
  [ChainReference.CosmosHubVega]: NetworkTypes.COSMOSHUB_VEGA,
  [ChainReference.OsmosisMainnet]: NetworkTypes.OSMOSIS_MAINNET,
  [ChainReference.OsmosisTestnet]: NetworkTypes.OSMOSIS_TESTNET
})

export const networkTypeToChainReference = invert(chainReferenceToNetworkType) as Record<
  NetworkTypes,
  ChainReference
>

export const chainNamespaceToChainType: Record<ChainNamespace, ChainTypes> = Object.freeze({
  [ChainNamespace.Bitcoin]: ChainTypes.Bitcoin,
  [ChainNamespace.Ethereum]: ChainTypes.Ethereum,
  [ChainNamespace.Cosmos]: ChainTypes.Cosmos
})
