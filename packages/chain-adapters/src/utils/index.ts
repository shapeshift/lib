import {
  AssetNamespace,
  CHAIN_NAMESPACE,
  CHAIN_REFERENCE,
  ChainId,
  fromChainId
} from '@shapeshiftoss/caip'

export * from './bip44'
export * from './utxoUtils'

export const getAssetNamespace = (type: string): AssetNamespace => {
  if (type === 'ERC20') return 'erc20'
  if (type === 'ERC721') return 'erc721'
  throw new Error(`Unknown asset namespace. type: ${type}`)
}

export const chainIdToChainLabel = (chainId: ChainId): string => {
  const { chainNamespace, chainReference } = fromChainId(chainId)

  switch (chainNamespace) {
    case CHAIN_NAMESPACE.Bitcoin:
      switch (chainReference) {
        case CHAIN_REFERENCE.BitcoinMainnet:
          return 'bitcoin'
        case CHAIN_REFERENCE.BitcoincashMainnet:
          return 'bitcoincash'
        case CHAIN_REFERENCE.DogecoinMainnet:
          return 'dogecoin'
        case CHAIN_REFERENCE.LitecoinMainnet:
          return 'litecoin'
        default:
          throw new Error(
            `chainReference: ${chainReference}, not supported for chainNamespace: ${chainNamespace}`
          )
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
