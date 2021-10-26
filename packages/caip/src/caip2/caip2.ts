// https://github.com/ChainAgnostic/CAIPs/blob/master/CAIPs/caip-2.md

import { ChainTypes, NetworkTypes } from '@shapeshiftoss/types'

export enum Namespace {
  Ethereum = 'eip155',
  Bitcoin = 'bip122'
}

export enum Reference {
  EthereumMainnet = '1',
  EthereumRopsten = '3',
  EthereumRinkeby = '4',
  // EthereumKovan = '42', // currently unsupported by shapeshift
  // https://github.com/bitcoin/bips/blob/master/bip-0122.mediawiki#definition-of-chain-id
  // caip2 uses max length of 32 chars of the genesis block
  BitcoinMainnet = '000000000019d6689c085ae165831e93',
  BitcoinTestnet = '000000000933ea01ad0ee984209779ba'
}

type ToCAIP2Args = {
  chain: ChainTypes
  network: NetworkTypes
}

export const toCAIP2 = ({ chain, network }: ToCAIP2Args): string => {
  const shapeShiftToCAIP2 = {
    [ChainTypes.Ethereum]: {
      namespace: Namespace.Ethereum,
      reference: {
        [NetworkTypes.MAINNET]: Reference.EthereumMainnet,
        [NetworkTypes.ETH_ROPSTEN]: Reference.EthereumRopsten,
        [NetworkTypes.ETH_RINKEBY]: Reference.EthereumRinkeby
      }
    },
    [ChainTypes.Bitcoin]: {
      namespace: Namespace.Bitcoin,
      reference: {
        [NetworkTypes.MAINNET]: Reference.BitcoinMainnet,
        [NetworkTypes.TESTNET]: Reference.BitcoinTestnet
      }
    }
  } as const

  const namespace: Namespace = shapeShiftToCAIP2[chain].namespace

  switch (chain) {
    case ChainTypes.Ethereum: {
      const referenceMap = shapeShiftToCAIP2[chain].reference
      switch (network) {
        case NetworkTypes.MAINNET:
        case NetworkTypes.ETH_ROPSTEN:
        case NetworkTypes.ETH_RINKEBY: {
          const reference: Reference = referenceMap[network]
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
          const reference: Reference = referenceMap[network]
          const caip2 = `${namespace}:${reference}`
          return caip2
        }
      }
    }
  }

  throw new Error(`toCAIP2: unsupported ${chain} network: ${network}`)
}

type FromCAIP19Return = {
  chain: ChainTypes
  network: NetworkTypes
}

export const fromCAIP2 = (caip2: string): FromCAIP19Return => {
  const [c, n] = caip2.split(':')
  if (!(c && n)) {
    throw new Error(`fromCAIP19: error parsing caip19, chain: ${c}, network: ${n}`)
  }
  switch (c) {
    case 'eip155': {
      const chain = ChainTypes.Ethereum
      switch (n) {
        case Reference.EthereumMainnet: {
          const network = NetworkTypes.MAINNET
          return { chain, network }
        }
        case Reference.EthereumRopsten: {
          const network = NetworkTypes.ETH_ROPSTEN
          return { chain, network }
        }
        case Reference.EthereumRinkeby: {
          const network = NetworkTypes.ETH_RINKEBY
          return { chain, network }
        }
        default: {
          throw new Error(`fromCAIP19: unsupported ${c} network: ${n}`)
        }
      }
    }
    case 'bip122': {
      const chain = ChainTypes.Bitcoin
      switch (n) {
        case Reference.BitcoinMainnet: {
          const network = NetworkTypes.MAINNET
          return { chain, network }
        }
        case Reference.BitcoinTestnet: {
          const network = NetworkTypes.TESTNET
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
