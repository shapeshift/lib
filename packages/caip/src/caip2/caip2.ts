// https://github.com/ChainAgnostic/CAIPs/blob/master/CAIPs/caip-2.md

import { ChainTypes, NetworkTypes } from '@shapeshiftoss/types'

export type CAIP2 = string

export enum ChainNamespace {
  Ethereum = 'eip155',
  Bitcoin = 'bip122',
  Cosmos = 'cosmos',
  Osmosis = 'osmosis'
}

export enum ChainReference {
  EthereumMainnet = '1',
  EthereumRopsten = '3',
  EthereumRinkeby = '4',
  // EthereumKovan = '42', // currently unsupported by shapeshift
  // https://github.com/bitcoin/bips/blob/master/bip-0122.mediawiki#definition-of-chain-id
  // caip2 uses max length of 32 chars of the genesis block
  BitcoinMainnet = '000000000019d6689c085ae165831e93',
  BitcoinTestnet = '000000000933ea01ad0ee984209779ba',
  CosmosMainnet = 'cosmoshub-4',
  OsmosisMainnet = 'osmosis-1'
}

type ToCAIP2Args = {
  chain: ChainTypes
  network: NetworkTypes
}

type ToCAIP2 = (args: ToCAIP2Args) => string

export const toCAIP2: ToCAIP2 = ({ chain, network }): string => {
  const shapeShiftToCAIP2 = {
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
        [NetworkTypes.MAINNET]: ChainReference.CosmosMainnet
      }
    },
    [ChainTypes.Osmosis]: {
      namespace: ChainNamespace.Osmosis,
      reference: {
        [NetworkTypes.MAINNET]: ChainReference.OsmosisMainnet
      }
    }
  } as const

  const namespace: ChainNamespace = shapeShiftToCAIP2[chain].namespace

  switch (chain) {
    case ChainTypes.Ethereum: {
      const referenceMap = shapeShiftToCAIP2[chain].reference
      switch (network) {
        case NetworkTypes.MAINNET:
        case NetworkTypes.ETH_ROPSTEN:
        case NetworkTypes.ETH_RINKEBY: {
          const reference: ChainReference = referenceMap[network]
          const caip2 = `${namespace}:${reference}`
          return caip2
        }
      }
      break
    }

    case ChainTypes.Bitcoin: {
      const referenceMap = shapeShiftToCAIP2[chain].reference
      switch (network) {
        case NetworkTypes.MAINNET:
        case NetworkTypes.TESTNET: {
          const reference: ChainReference = referenceMap[network]
          const caip2 = `${namespace}:${reference}`
          return caip2
        }
      }
      break
    }
    case ChainTypes.Cosmos: {
      const referenceMap = shapeShiftToCAIP2[chain].reference
      switch (network) {
        case NetworkTypes.MAINNET: {
          const reference: ChainReference = referenceMap[network]
          const caip2 = `${namespace}:${reference}`
          return caip2
        }
      }
      break
    }
    case ChainTypes.Osmosis: {
      const referenceMap = shapeShiftToCAIP2[chain].reference
      switch (network) {
        case NetworkTypes.MAINNET: {
          const reference: ChainReference = referenceMap[network]
          const caip2 = `${namespace}:${reference}`
          return caip2
        }
      }
    }
  }

  throw new Error(`toCAIP2: unsupported ${chain} network: ${network}`)
}

type FromCAIP2Return = {
  chain: ChainTypes
  network: NetworkTypes
}

type FromCAIP2 = (caip2: string) => FromCAIP2Return

export const fromCAIP2: FromCAIP2 = (caip2) => {
  const [c, n] = caip2.split(':')
  if (!(c && n)) {
    throw new Error(`fromCAIP19: error parsing caip19, chain: ${c}, network: ${n}`)
  }
  switch (c) {
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
          throw new Error(`fromCAIP19: unsupported ${c} network: ${n}`)
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
          throw new Error(`fromCAIP19: unsupported ${c} network: ${n}`)
        }
      }
    }
    case ChainNamespace.Cosmos: {
      const chain = ChainTypes.Cosmos
      switch (n) {
        case ChainReference.CosmosMainnet: {
          const network = NetworkTypes.MAINNET
          return { chain, network }
        }
        default: {
          throw new Error(`fromCAIP19: unsupported ${c} network: ${n}`)
        }
      }
    }
    case ChainNamespace.Osmosis: {
      const chain = ChainTypes.Osmosis
      switch (n) {
        case ChainReference.OsmosisMainnet: {
          const network = NetworkTypes.MAINNET
          return { chain, network }
        }
        default: {
          throw new Error(`fromCAIP19: unsupported ${c} network: ${n}`)
        }
      }
    }
  }

  throw new Error(`fromCAIP19: unsupported chain: ${c}`)
}

type IsCAIP2 = (caip2: string) => boolean

export const isCAIP2: IsCAIP2 = (caip2) => {
  const [c, n] = caip2.split(':')
  if (!(c && n)) {
    throw new Error(`isCAIP2: error parsing caip19, chain: ${c}, network: ${n}`)
  }

  switch (c) {
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
    case ChainNamespace.Cosmos: {
      switch (n) {
        case ChainReference.CosmosMainnet:
          return true
      }
      break
    }
    case ChainNamespace.Osmosis: {
      switch (n) {
        case ChainReference.OsmosisMainnet:
          return true
      }
      break
    }
  }

  throw new Error(`isCAIP2: invalid caip2 ${caip2}`)
}
