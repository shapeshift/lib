import { AccountId, fromAccountId } from './accountId/accountId'
import { AssetId, fromAssetId } from './assetId/assetId'
import { ChainId, fromChainId, networkTypeToChainReference, toChainId } from './chainId/chainId'

export const btcAssetId = 'bip122:000000000019d6689c085ae165831e93/slip44:0'
export const ethAssetId = 'eip155:1/slip44:60'
export const cosmosAssetId = 'cosmos:cosmoshub-4/slip44:118'
export const osmosisAssetId = 'cosmos:osmosis-1/slip44:118'

export const ethChainId = 'eip155:1'
export const btcChainId = 'bip122:000000000019d6689c085ae165831e93'
export const cosmosChainId = 'cosmos:cosmoshub-4'
export const osmosisChainId = 'cosmos:osmosis-1'

// This is also a map of fee assetIds by chainId
export const chainIdToAssetId: Record<ChainId, AssetId> = {
  [ethChainId]: ethAssetId,
  [btcChainId]: btcAssetId,
  [cosmosChainId]: cosmosAssetId,
  [osmosisChainId]: osmosisAssetId
}
export const assetIdToChainId = (assetId: AssetId): string => {
  const { chain, network } = fromAssetId(assetId)
  return toChainId({ chain, network })
}

export const accountIdToChainId = (accountId: AccountId): ChainId =>
  fromAccountId(accountId).chainId

export const accountIdToSpecifier = (accountId: AccountId): string =>
  fromAccountId(accountId).account

export const getChainReferenceFromChainId = (chainId: ChainId) =>
  networkTypeToChainReference[fromChainId(chainId).network]

export const chainIdToFeeAssetId = (chainId: ChainId): AssetId => chainIdToAssetId[chainId]

// We make the assumption here that the fee assetIds are in `chainIdToAssetId` for each
// chain we support.
export const getFeeAssetIdFromAssetId = (assetId: AssetId): AssetId =>
  chainIdToAssetId[assetIdToChainId(assetId)]

