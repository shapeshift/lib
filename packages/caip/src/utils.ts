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

export const isValidChainPartsPair = (
  chainNamespace: ChainNamespace,
  chainReference: ChainReference
) => VALID_CHAIN_IDS[chainNamespace].includes(chainReference)

export const isValidChainId = (maybeChainId: ChainId | string): maybeChainId is ChainId => {
  const chainIdRegExp = /([-a-z\d]{3,8}):([-a-zA-Z\d]{1,32})/
  const [maybeChainNamespace, maybeChainReference] =
    chainIdRegExp.exec(maybeChainId)?.slice(1) ?? []
  return (
    isChainNamespace(maybeChainNamespace) &&
    isChainReference(maybeChainReference) &&
    isValidChainPartsPair(maybeChainNamespace, maybeChainReference)
  )
}

const getTypeGuardAssertion = <T>(
  typeGuard: (maybeT: T | string) => maybeT is T,
  message: string
) => {
  return (value: T | string | undefined): asserts value is T => {
    if ((value && !typeGuard(value)) || !value) throw new Error(`${message}: ${value}`)
  }
}

// FIXME: Add tests for assertion helpers
export const assertIsValidChainId: (
  value: ChainId | string | undefined
) => asserts value is ChainId = getTypeGuardAssertion(
  isValidChainId,
  'assertIsValidChainId: unsupported ChainId'
)

export const assertIsChainNamespace: (
  value: ChainNamespace | string | undefined
) => asserts value is ChainNamespace = getTypeGuardAssertion(
  isChainNamespace,
  'assertIsChainNamespace: unsupported ChainNamespace'
)

export const assertIsChainReference: (
  value: ChainReference | string | undefined
) => asserts value is ChainReference = getTypeGuardAssertion(
  isChainReference,
  'assertIsChainReference: unsupported ChainReference'
)

export const assertValidChainPartsPair = (
  chainNamespace: ChainNamespace,
  chainReference: ChainReference
) => {
  if (!isValidChainPartsPair(chainNamespace, chainReference))
    throw new Error(
      `toAssetId: Chain Reference ${chainReference} not supported for Chain Namespace ${chainNamespace}`
    )
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
