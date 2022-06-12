import {
  CHAIN_NAMESPACE,
  CHAIN_REFERENCE,
  ChainId,
  ChainNamespace,
  ChainReference,
  fromChainId
} from '@shapeshiftoss/caip'

// https://www.coingecko.com/en/api/documentation - See asset_platforms
export const chainPartsToCoingeckoAssetPlatform = (
  chainNamespace: ChainNamespace,
  chainReference?: ChainReference
): string => {
  return (() => {
    switch (chainNamespace) {
      case CHAIN_NAMESPACE.Ethereum:
        return 'ethereum'
      case CHAIN_NAMESPACE.Cosmos:
        return chainReference === CHAIN_REFERENCE.CosmosHubMainnet ? 'cosmos' : 'osmosis'
      default:
        throw new Error(
          `chainNamespace ${chainNamespace}, chainReference ${chainReference} not supported.`
        )
    }
  })()
}

export const chainIdToCoingeckoAssetPlatform = (chainId: ChainId): string => {
  const { chainNamespace, chainReference } = fromChainId(chainId)
  return chainPartsToCoingeckoAssetPlatform(chainNamespace, chainReference)
}
