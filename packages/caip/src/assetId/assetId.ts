// https://github.com/ChainAgnostic/CAIPs/blob/master/CAIPs/caip-19.md
import { ChainTypes, NetworkTypes } from '@shapeshiftoss/types'
import toLower from 'lodash/toLower'

import {
  CHAIN_NAMESPACE,
  CHAIN_REFERENCE,
  ChainId,
  ChainNamespace,
  ChainReference,
  toChainId
} from '../chainId/chainId'

export type AssetId = string

const assetNamespaceStrings = [
  'cw20',
  'cw721',
  'erc20',
  'erc721',
  'slip44',
  'native',
  'ibc'
] as const

export type AssetNamespace = typeof assetNamespaceStrings[number]

export const ASSET_REFERENCE = {
  Bitcoin: '0',
  Ethereum: '60',
  Cosmos: '118',
  Osmosis: '118'
} as const

export type AssetReference = typeof ASSET_REFERENCE[keyof typeof ASSET_REFERENCE]

type ToAssetIdArgs = {
  chain?: ChainTypes
  network?: NetworkTypes | ChainReference
  chainNamespace?: ChainNamespace
  chainReference?: ChainReference
  assetNamespace: AssetNamespace
  assetReference: AssetReference | string
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
  assetNamespaceStrings.some((s) => s === maybeAssetNamespace)

export const isAssetReference = (
  maybeAssetReference: AssetReference | string
): maybeAssetReference is AssetReference =>
  Object.values(ASSET_REFERENCE).some((s) => s === maybeAssetReference)

export const isChainId = (maybeChainId: ChainId | string): maybeChainId is ChainId => {
  const chainIdRegExp = /([-a-z\d]{3,8}):([-a-zA-Z\d]{1,32})/
  const [maybeChainNamespace, maybeChainReference] =
    chainIdRegExp.exec(maybeChainId)?.slice(1) ?? []
  return isChainNamespace(maybeChainNamespace) && isChainReference(maybeChainReference)
}

export const chainIdOrUndefined = (maybeChainId: string): ChainId | undefined =>
  isChainId(maybeChainId) ? maybeChainId : undefined

/**
 * validate that a value is a string slip44 value
 * @see https://github.com/satoshilabs/slips/blob/master/slip-0044.md
 * @param {string} value - possible slip44 value
 */
const isValidSlip44 = (value: string) => {
  const n = Number(value)
  // slip44 has a max value of an unsigned 32-bit integer
  return !isNaN(n) && n >= 0 && n < 4294967296
}

type ToAssetId = (args: ToAssetIdArgs) => AssetId

export const toAssetId: ToAssetId = (args: ToAssetIdArgs): AssetId => {
  const { chainNamespace, chainReference, assetNamespace, chain, network } = args
  let { assetReference } = args
  // if (!chain) throw new Error('toAssetId: No chain provided')
  // if (!network) throw new Error('toAssetId: No chainReference Provided')
  if (!assetNamespace) throw new Error('toAssetId: No assetNamespace provided')
  if (!assetReference) throw new Error('toAssetId: No assetReference provided')

  let chainId
  if (network && chain) {
    chainId = toChainId({ chain, network })
  } else {
    chainId = chainIdOrUndefined(`${chainNamespace}:${chainReference}`) // FIXME: use toChainId
  }

  if (chainNamespace && !isChainNamespace(chainNamespace)) {
    throw new Error(
      `toAssetId: Asset Namespace ${assetNamespace} not supported for Chain Namespace ${chainNamespace}`
    )
  }

  if (chainReference && !isChainReference(chainReference)) {
    throw new Error(
      `toAssetId: Asset Namespace ${assetNamespace} not supported for Chain Reference ${chainReference}`
    )
  }

  if (assetNamespace === 'slip44' && !isValidSlip44(String(assetReference))) {
    throw new Error(`Invalid reference for namespace slip44`)
  }

  if (Array<AssetNamespace>('erc20', 'erc721').includes(assetNamespace)) {
    if (!assetReference.startsWith('0x')) {
      throw new Error(`toAssetId: assetReference must start with 0x: ${assetReference}`)
    }
    if (assetReference.length !== 42) {
      throw new Error(
        `toAssetId: assetReference length must be 42, length: ${assetReference.length}`
      )
    }

    // We make Eth contract addresses lower case to simplify comparisons
    assetReference = assetReference.toLowerCase()
  }

  return `${chainId}/${assetNamespace}:${assetReference}`
}

type FromAssetIdReturn = {
  // chain: ChainTypes
  chainNamespace: ChainNamespace
  chainReference: ChainReference
  chainId: ChainId
  // network: NetworkTypes
  assetNamespace: AssetNamespace
  assetReference: AssetReference | string
}

export type FromAssetId = (assetId: AssetId) => FromAssetIdReturn

const parseAssetIdRegExp = /([-a-z\d]{3,8}):([-a-zA-Z\d]{1,32})\/([-a-z\d]{3,8}):([-a-zA-Z\d]+)/

export const fromAssetId: FromAssetId = (assetId) => {
  const matches = parseAssetIdRegExp.exec(assetId) ?? []

  const chainNamespace = isChainNamespace(matches[1]) ? matches[1] : undefined
  const chainReference = isChainReference(matches[2]) ? matches[2] : undefined
  const assetNamespace = isAssetNamespace(matches[3]) ? matches[3] : undefined

  const shouldLowercaseAssetReference =
    assetNamespace && ['erc20', 'erc721'].includes(assetNamespace)

  const assetReference = shouldLowercaseAssetReference ? toLower(matches[4]) : matches[4]
  if (!chainNamespace || !chainReference) {
    throw new Error(`fromAssetId: invalid AssetId: ${assetId}`)
  }
  const chainId = chainIdOrUndefined(`${chainNamespace}:${chainReference}`) // FIXME: use toChainId

  const hasAllParts = !!(
    chainNamespace &&
    chainReference &&
    assetNamespace &&
    assetReference &&
    chainId
  )

  if (hasAllParts) {
    return { chainId, chainReference, chainNamespace, assetNamespace, assetReference }
  } else {
    throw new Error(`fromAssetId: invalid AssetId: ${assetId}`)
  }
}

export const toCAIP19 = toAssetId
export const fromCAIP19 = fromAssetId
