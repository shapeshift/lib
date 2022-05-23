// https://github.com/ChainAgnostic/CAIPs/blob/master/CAIPs/caip-2.md

import { NetworkTypes } from '@shapeshiftoss/types'
import invert from 'lodash/invert'

import { CHAIN_NAMESPACE, CHAIN_REFERENCE } from '../constants'
import { assertIsValidChainId, isChainNamespace, isChainReference, isValidChain } from '../utils'

export type ChainId = string

export type ChainNamespace = typeof CHAIN_NAMESPACE[keyof typeof CHAIN_NAMESPACE]
export type ChainReference = typeof CHAIN_REFERENCE[keyof typeof CHAIN_REFERENCE]

type ToChainIdArgs = {
  chainNamespace: ChainNamespace
  chainReference: ChainReference
}

export const toChainId = (args: ToChainIdArgs): ChainId => {
  const { chainNamespace, chainReference } = args
  const maybeChainId = `${chainNamespace}:${chainReference}`
  assertIsValidChainId(maybeChainId)
  return maybeChainId
}

type FromChainIdReturn = {
  chainNamespace: ChainNamespace
  chainReference: ChainReference
}

type FromChainId = (chainId: string) => FromChainIdReturn

export const fromChainId: FromChainId = (chainId) => {
  const [maybeChainNamespace, maybeChainReference] = chainId.split(':')
  if (!isChainNamespace(maybeChainNamespace))
    throw new Error(`fromChainId: unsupported Chain Namespace: ${maybeChainNamespace}`)

  if (!isChainReference(maybeChainReference))
    throw new Error(`fromChainId: unsupported Chain Reference: ${maybeChainReference}`)

  if (!isValidChain(maybeChainNamespace, maybeChainReference))
    throw new Error(
      `fromChainId: error parsing chainId, Chain Namespace: ${maybeChainNamespace}, Chain Reference: ${maybeChainReference}`
    )

  return { chainNamespace: maybeChainNamespace, chainReference: maybeChainReference }
}

export const chainReferenceToNetworkType: Record<ChainReference, NetworkTypes> = Object.freeze({
  [CHAIN_REFERENCE.BitcoinMainnet]: NetworkTypes.MAINNET,
  [CHAIN_REFERENCE.BitcoinTestnet]: NetworkTypes.TESTNET,
  [CHAIN_REFERENCE.EthereumMainnet]: NetworkTypes.MAINNET,
  [CHAIN_REFERENCE.EthereumRopsten]: NetworkTypes.ETH_ROPSTEN,
  [CHAIN_REFERENCE.EthereumRinkeby]: NetworkTypes.ETH_RINKEBY,
  [CHAIN_REFERENCE.CosmosHubMainnet]: NetworkTypes.COSMOSHUB_MAINNET,
  [CHAIN_REFERENCE.CosmosHubVega]: NetworkTypes.COSMOSHUB_VEGA,
  [CHAIN_REFERENCE.OsmosisMainnet]: NetworkTypes.OSMOSIS_MAINNET,
  [CHAIN_REFERENCE.OsmosisTestnet]: NetworkTypes.OSMOSIS_TESTNET
})

export const networkTypeToChainReference = invert(chainReferenceToNetworkType) as Record<
  NetworkTypes,
  ChainReference
>

export const toCAIP2 = toChainId
export const fromCAIP2 = fromChainId
