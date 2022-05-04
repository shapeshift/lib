import { ChainId, fromCAIP2, networkTypeToChainReference, toCAIP2 } from './caip2/caip2'
import { AccountId, fromCAIP10 } from './caip10/caip10'
import { AssetId, fromCAIP19 } from './caip19/caip19'

export const btcAssetId = 'bip122:000000000019d6689c085ae165831e93/slip44:0'
export const ethAssetId = 'eip155:1/slip44:60'
export const cosmosAssetId = 'cosmos:cosmoshub-4/slip44:118'

export const ethChainId = 'eip155:1'
export const btcChainId = 'bip122:000000000019d6689c085ae165831e93'
export const cosmosChainId = 'cosmos:cosmoshub-4'

export const chainIdToAssetId: Record<string, string> = {
  [ethChainId]: 'eip155:1/slip44:60',
  [btcChainId]: 'bip122:000000000019d6689c085ae165831e93/slip44:0',
  [cosmosChainId]: 'cosmos:cosmoshub-4/slip44:118'
}
export const assetIdtoChainId = (assetId: AssetId): string => {
  const { chain, network } = fromCAIP19(assetId)
  const chainId = toCAIP2({ chain, network })

  return chainId
}

export const accountIdToChainId = (accountId: AccountId): ChainId => {
  // accountId = 'eip155:1:0xdef1...cafe
  const { caip2 } = fromCAIP10(accountId)
  return caip2
}

export const accountIdToSpecifier = (accountId: AccountId): string => {
  const { account } = fromCAIP10(accountId)
  return account
}

export const getChainReferenceFromChainId = (chainId: ChainId) => {
  const { network } = fromCAIP2(chainId)
  const chainReference = networkTypeToChainReference[network]
  return chainReference
}
