import { CAIP2, ChainId } from './caip2/caip2'
import { AssetId } from './caip19/caip19'

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
// TODO(gomes): this probably needs better terminology than "supported"?
const supportedChainIds = [ethChainId, btcChainId, cosmosChainId] as const

export type ChainIdType = typeof supportedChainIds[number]
export type AccountSpecifier = string

export const assetIdtoChainId = (assetId: AssetId): ChainIdType =>
  assetId.split('/')[0] as ChainIdType

export const accountIdToChainId = (accountId: AccountSpecifier): ChainId => {
  // accountId = 'eip155:1:0xdef1...cafe
  const [chain, network] = accountId.split(':')
  return `${chain}:${network}`
}

export const accountIdToSpecifier = (accountId: AccountSpecifier): string => {
  // in the case of account based chains (eth), this is an address
  // in the case of utxo based chains, this is an x/y/zpub
  return accountId.split(':')[2] ?? ''
}

// TODO(gomes): Do we still want to call this "reference" or do we want a higher-level naming for this?
// We're already using accountId, assetId, and chainId higher-level terminologies vs. the specc-y ones from CAIP
export const getReferenceFromChainId = (caip2: CAIP2) =>
  caip2.match(/^(?<caip2Namespace>[-a-z0-9]{3,8}):(?<caip2Reference>[-a-zA-Z0-9]{1,32})$/)?.groups
    ?.caip2Reference
