import {
  AssetNamespace,
  CHAIN_NAMESPACE,
  CHAIN_REFERENCE,
  ChainId,
  fromChainId
} from '@shapeshiftoss/caip'
import { Status, TransferType } from '@shapeshiftoss/unchained-client'

import { TxStatus, TxType } from '../types'

export * from './bip44'
export * from './utxoUtils'

export const getAssetNamespace = (type: string): AssetNamespace => {
  if (type === 'ERC20') return 'erc20'
  if (type === 'ERC721') return 'erc721'
  throw new Error(`Unknown asset namespace. type: ${type}`)
}

export const getStatus = (status: Status): TxStatus => {
  if (status === Status.Pending) return TxStatus.Pending
  if (status === Status.Confirmed) return TxStatus.Confirmed
  if (status === Status.Failed) return TxStatus.Failed

  return TxStatus.Unknown
}

export const getType = (type: TransferType): TxType => {
  if (type === TransferType.Send) return TxType.Send
  if (type === TransferType.Receive) return TxType.Receive

  return TxType.Unknown
}

export const chainIdToChainLabel = (chainId: ChainId): string => {
  const { chainNamespace, chainReference } = fromChainId(chainId)

  switch (chainNamespace) {
    case CHAIN_NAMESPACE.Bitcoin:
      switch (chainReference) {
        case CHAIN_REFERENCE.DogecoinMainnet:
        case CHAIN_REFERENCE.DogecoinTestnet:
          return 'dogecoin'
        default:
          return 'bitcoin'
      }
    case CHAIN_NAMESPACE.Ethereum:
      switch (chainReference) {
        case CHAIN_REFERENCE.EthereumMainnet:
        case CHAIN_REFERENCE.EthereumRinkeby:
        case CHAIN_REFERENCE.EthereumRopsten:
          return 'ethereum'
        case CHAIN_REFERENCE.AvalancheCChain:
          return 'avalanche'
        default:
          throw new Error(
            `chainReference: ${chainReference}, not supported for chainNamespace: ${chainNamespace}`
          )
      }
    case CHAIN_NAMESPACE.Cosmos:
      switch (chainReference) {
        case CHAIN_REFERENCE.CosmosHubMainnet:
        case CHAIN_REFERENCE.CosmosHubVega:
          return 'cosmos'
        case CHAIN_REFERENCE.OsmosisMainnet:
        case CHAIN_REFERENCE.OsmosisTestnet:
          return 'osmosis'
        default:
          throw new Error(
            `chainReference: ${chainReference}, not supported for chainNamespace: ${chainNamespace}`
          )
      }
    default:
      throw new Error(`chainNamespace ${chainNamespace} not supported.`)
  }
}
