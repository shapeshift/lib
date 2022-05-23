// https://github.com/ChainAgnostic/CAIPs/blob/master/CAIPs/caip-19.md
import toLower from 'lodash/toLower'

import { ChainId, ChainNamespace, ChainReference, toChainId } from '../chainId/chainId'
import { ASSET_NAMESPACE_STRINGS, ASSET_REFERENCE, VALID_ASSET_NAMESPACE } from '../constants'
import {
  assertIsChainNamespace,
  assertIsChainReference,
  assertValidChainPartsPair,
  isAssetNamespace,
  isChainNamespace,
  isChainReference
} from '../utils'

// eslint-disable-next-line @typescript-eslint/no-var-requires
// const { CHAIN_NAMESPACE } = require('./utils')

export type AssetId = string

export type AssetNamespace = typeof ASSET_NAMESPACE_STRINGS[number]

export type AssetReference = typeof ASSET_REFERENCE[keyof typeof ASSET_REFERENCE]

type ToAssetIdArgs = {
  chainNamespace: ChainNamespace
  chainReference: ChainReference
  assetNamespace: AssetNamespace
  assetReference: AssetReference | string
}

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
  const { chainNamespace, chainReference, assetNamespace, assetReference } = args
  if (!assetNamespace) throw new Error('toAssetId: No assetNamespace provided')
  if (!assetReference) throw new Error('toAssetId: No assetReference provided')

  const isContractAddress = Array<AssetNamespace>('erc20', 'erc721').includes(assetNamespace)
  const chainId = toChainId({ chainNamespace, chainReference })

  assertIsChainNamespace(chainNamespace)
  assertIsChainReference(chainReference)
  assertValidChainPartsPair(chainNamespace, chainReference)

  if (
    !VALID_ASSET_NAMESPACE[chainNamespace].includes(assetNamespace) ||
    !isAssetNamespace(assetNamespace)
  )
    throw new Error(
      `toAssetId: AssetNamespace ${assetNamespace} not supported for Chain Namespace ${chainNamespace}`
    )

  if (assetNamespace === 'slip44' && !isValidSlip44(String(assetReference))) {
    throw new Error(`Invalid reference for namespace slip44`)
  }

  if (isContractAddress) {
    if (!assetReference.startsWith('0x'))
      throw new Error(`toAssetId: assetReference must start with 0x: ${assetReference}`)
    if (assetReference.length !== 42)
      throw new Error(
        `toAssetId: assetReference length must be 42, length: ${assetReference.length}`
      )
  }

  // We make Eth contract addresses lower case to simplify comparisons
  const assetReferenceCaseCorrected = isContractAddress
    ? assetReference.toLowerCase()
    : assetReference

  return `${chainId}/${assetNamespace}:${assetReferenceCaseCorrected}`
}

type FromAssetIdReturn = {
  chainNamespace: ChainNamespace
  chainReference: ChainReference
  chainId: ChainId
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
  assertIsChainReference(chainReference)
  assertIsChainNamespace(chainNamespace)
  const chainId = toChainId({ chainNamespace, chainReference })

  if (assetNamespace && assetReference && chainId) {
    return { chainId, chainReference, chainNamespace, assetNamespace, assetReference }
  } else {
    throw new Error(`fromAssetId: invalid AssetId: ${assetId}`)
  }
}

export const toCAIP19 = toAssetId
export const fromCAIP19 = fromAssetId
