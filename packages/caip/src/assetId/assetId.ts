// https://github.com/ChainAgnostic/CAIPs/blob/master/CAIPs/caip-19.md
import { ChainTypes, NetworkTypes } from '@shapeshiftoss/types'

import {
  ChainNamespace,
  chainNamespaceToChainType,
  ChainReference,
  chainReferenceToNetworkType,
  toChainId
} from '../chainId/chainId'

export type AssetId = string

export const ASSET_NAMESPACE = {
  CW20: 'cw20',
  CW721: 'cw721',
  ERC20: 'erc20',
  ERC721: 'erc721',
  Slip44: 'slip44',
  NATIVE: 'native',
  IBC: 'ibc'
} as const

export type AssetNamespace = typeof ASSET_NAMESPACE[keyof typeof ASSET_NAMESPACE]

export const ASSET_REFERENCE = {
  Bitcoin: '0',
  Ethereum: '60',
  Cosmos: '118',
  Osmosis: '118'
} as const

export type AssetReference = typeof ASSET_REFERENCE[keyof typeof ASSET_REFERENCE]

type ToAssetIdArgs = {
  chain: ChainTypes
  network: NetworkTypes | ChainReference
  assetNamespace: AssetNamespace
  assetReference: AssetReference | string
}

type ValidNamespace = {
  [k in ChainTypes]: AssetNamespace[]
}

const validAssetNamespaces: ValidNamespace = Object.freeze({
  [ChainTypes.Bitcoin]: [ASSET_NAMESPACE.Slip44],
  [ChainTypes.Ethereum]: [ASSET_NAMESPACE.Slip44, ASSET_NAMESPACE.ERC20, ASSET_NAMESPACE.ERC721],
  [ChainTypes.Cosmos]: [
    ASSET_NAMESPACE.CW20,
    ASSET_NAMESPACE.CW721,
    ASSET_NAMESPACE.IBC,
    ASSET_NAMESPACE.NATIVE,
    ASSET_NAMESPACE.Slip44
  ],
  [ChainTypes.Osmosis]: [
    ASSET_NAMESPACE.CW20,
    ASSET_NAMESPACE.CW721,
    ASSET_NAMESPACE.IBC,
    ASSET_NAMESPACE.NATIVE,
    ASSET_NAMESPACE.Slip44
  ]
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function stringToEnum<T>(obj: any, item: string): T | undefined {
  const found = Object.entries(obj).find((i) => i.includes(item))?.[0]
  return found ? obj[found as keyof T] : undefined
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

type ToAssetId = (args: ToAssetIdArgs) => string

export const toAssetId: ToAssetId = (args: ToAssetIdArgs): string => {
  const { chain, network, assetNamespace } = args
  let { assetReference } = args
  if (!chain) throw new Error('toAssetId: No chain provided')
  if (!network) throw new Error('toAssetId: No chainReference Provided')
  if (!assetNamespace) throw new Error('toAssetId: No assetNamespace provided')
  if (!assetReference) throw new Error('toAssetId: No assetReference provided')

  const chainId = toChainId({ chain, network })

  if (!validAssetNamespaces[chain].includes(assetNamespace)) {
    throw new Error(`toAssetId: Asset Namespace ${assetNamespace} not supported for chain ${chain}`)
  }

  if (assetNamespace === ASSET_NAMESPACE.Slip44 && !isValidSlip44(String(assetReference))) {
    throw new Error(`Invalid reference for namespace slip44`)
  }

  if (
    Array<AssetNamespace>(ASSET_NAMESPACE.ERC20, ASSET_NAMESPACE.ERC721).includes(assetNamespace)
  ) {
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
  chain: ChainTypes
  network: NetworkTypes
  assetNamespace: AssetNamespace
  assetReference: AssetReference | string
}

export type FromAssetId = (assetId: AssetId) => FromAssetIdReturn

const parseAssetIdRegExp = /([-a-z\d]{3,8}):([-a-zA-Z\d]{1,32})\/([-a-z\d]{3,8}):([-a-zA-Z\d]+)/

export const fromAssetId: FromAssetId = (assetId) => {
  const matches = parseAssetIdRegExp.exec(assetId) ?? []

  // We're okay casting these strings to enums because we check to make sure
  // they are valid enum values
  let chain: ChainTypes = chainNamespaceToChainType[matches[1] as ChainNamespace]
  const network = chainReferenceToNetworkType[matches[2] as ChainReference]
  const assetNamespace = stringToEnum<AssetNamespace>(ASSET_NAMESPACE, matches[3])
  let assetReference = matches[4]

  if (chain && network && assetNamespace && assetReference) {
    switch (network) {
      case NetworkTypes.OSMOSIS_MAINNET:
      case NetworkTypes.OSMOSIS_TESTNET:
        chain = ChainTypes.Osmosis
    }

    switch (assetNamespace) {
      case ASSET_NAMESPACE.ERC20:
      case ASSET_NAMESPACE.ERC721: {
        assetReference = assetReference.toLowerCase()
      }
    }

    return { chain, network, assetNamespace, assetReference }
  }

  throw new Error(`fromAssetId: invalid AssetId: ${assetId}`)
}

export const toCAIP19 = toAssetId
export const fromCAIP19 = fromAssetId
