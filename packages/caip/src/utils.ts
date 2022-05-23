import { AccountId, fromAccountId } from './accountId/accountId'
import { AssetId, AssetNamespace, AssetReference, fromAssetId, toAssetId } from './assetId/assetId'
import { ChainId, ChainNamespace, ChainReference } from './chainId/chainId'
import {
  ASSET_NAMESPACE_STRINGS,
  ASSET_REFERENCE,
  CHAIN_NAMESPACE,
  CHAIN_REFERENCE,
  VALID_CHAIN_IDS
} from './constants'

export const btcAssetId = 'bip122:000000000019d6689c085ae165831e93/slip44:0'
export const ethAssetId = 'eip155:1/slip44:60'
export const cosmosAssetId = 'cosmos:cosmoshub-4/slip44:118'
export const osmosisAssetId = 'cosmos:osmosis-1/slip44:118'

export const ethChainId = 'eip155:1'
export const btcChainId = 'bip122:000000000019d6689c085ae165831e93'
export const cosmosChainId = 'cosmos:cosmoshub-4'
export const osmosisChainId = 'cosmos:osmosis-1'

// TODO(ryankk): this will be removed and replaced with something like `toAssetId(fromChainId(chainId))`
// when `fromChainId` supports returning ChainNamespace and ChainReference.
export const chainIdToAssetId: Record<ChainId, AssetId> = {
  [ethChainId]: ethAssetId,
  [btcChainId]: btcAssetId,
  [cosmosChainId]: cosmosAssetId,
  [osmosisChainId]: osmosisAssetId
}

export const accountIdToChainId = (accountId: AccountId): ChainId =>
  fromAccountId(accountId).chainId

export const accountIdToSpecifier = (accountId: AccountId): string =>
  fromAccountId(accountId).account

export const chainIdToFeeAssetId = (chainId: ChainId): AssetId => chainIdToAssetId[chainId]

// We make the assumption here that the fee assetIds are in `chainIdToAssetId` for each
// chain we support.
export const getFeeAssetIdFromAssetId = (assetId: AssetId): AssetId | undefined => {
  const { chainId } = fromAssetId(assetId)
  return chainIdToAssetId[chainId]
}

export const isChainNamespace = (
  maybeChainNamespace: ChainNamespace | string
): maybeChainNamespace is ChainNamespace =>
  Object.values(CHAIN_NAMESPACE).some((s) => s === maybeChainNamespace)

export const isChainReference = (
  maybeChainReference: ChainReference | string
): maybeChainReference is ChainReference =>
  Object.values(CHAIN_REFERENCE).some((s) => s === maybeChainReference)

export const isAssetNamespace = (
  maybeAssetNamespace: AssetNamespace | string
): maybeAssetNamespace is AssetNamespace =>
  ASSET_NAMESPACE_STRINGS.some((s) => s === maybeAssetNamespace)

export const isAssetReference = (
  maybeAssetReference: AssetReference | string
): maybeAssetReference is AssetReference =>
  Object.values(ASSET_REFERENCE).some((s) => s === maybeAssetReference)

export const isValidChain = (chainNamespace: ChainNamespace, chainReference: ChainReference) =>
  VALID_CHAIN_IDS[chainNamespace].includes(chainReference)

export const isValidChainId = (maybeChainId: ChainId | string): maybeChainId is ChainId => {
  const chainIdRegExp = /([-a-z\d]{3,8}):([-a-zA-Z\d]{1,32})/
  const [maybeChainNamespace, maybeChainReference] =
    chainIdRegExp.exec(maybeChainId)?.slice(1) ?? []
  if (
    isChainNamespace(maybeChainNamespace) &&
    isChainReference(maybeChainReference) &&
    isValidChain(maybeChainNamespace, maybeChainReference)
  ) {
    return true
  } else {
    throw new Error(`isChainId: invalid ChainId ${maybeChainId}`)
  }
}

export const assertIsValidChainId: (
  maybeChainId: ChainId | string
) => asserts maybeChainId is ChainId = (
  maybeChainId: ChainId | string
): asserts maybeChainId is ChainId => {
  if (!isValidChainId(maybeChainId))
    throw new Error(`assertIsValidChainId: invalid ChainId ${maybeChainId}`)
}

export const makeBtcData = () => {
  const chainNamespace = CHAIN_NAMESPACE.Bitcoin
  const chainReference = CHAIN_REFERENCE.BitcoinMainnet
  const assetId = toAssetId({
    chainNamespace,
    chainReference,
    assetNamespace: 'slip44',
    assetReference: ASSET_REFERENCE.Bitcoin
  })
  return { [assetId]: 'bitcoin' }
}

export const makeCosmosHubData = () => {
  const chainNamespace = CHAIN_NAMESPACE.Cosmos
  const chainReference = CHAIN_REFERENCE.CosmosHubMainnet
  const assetId = toAssetId({
    chainNamespace,
    chainReference,
    assetNamespace: 'slip44',
    assetReference: ASSET_REFERENCE.Cosmos
  })
  return { [assetId]: 'cosmos' }
}

export const makeOsmosisData = () => {
  const chainNamespace = CHAIN_NAMESPACE.Cosmos
  const chainReference = CHAIN_REFERENCE.OsmosisMainnet
  const assetId = toAssetId({
    chainNamespace,
    chainReference,
    assetNamespace: 'slip44',
    assetReference: ASSET_REFERENCE.Osmosis
  })
  return { [assetId]: 'osmosis' }
}
