import { AccountId, fromAccountId } from './accountId/accountId'
import { ChainId, ChainNamespace, ChainReference } from './chainId/chainId'
import * as constants from './constants'

// https://regex101.com/r/f0xGqP/2
export const parseAssetIdRegExp =
  /(?<chainNamespace>[-a-z\d]{3,8}):(?<chainReference>[-a-zA-Z\d]{1,32})\/(?<assetNamespace>[-a-z\d]{3,8}):(?<assetReference>[-a-zA-Z\d]+)/

export const accountIdToChainId = (accountId: AccountId): ChainId =>
  fromAccountId(accountId).chainId

export const accountIdToSpecifier = (accountId: AccountId): string =>
  fromAccountId(accountId).account

export const isValidChainPartsPair = (
  chainNamespace: ChainNamespace,
  chainReference: ChainReference
) => constants.VALID_CHAIN_IDS[chainNamespace]?.includes(chainReference) || false

export const bitcoinAssetMap = { [constants.btcAssetId]: 'bitcoin' }
export const bitcoincashAssetMap = { [constants.bchAssetId]: 'bitcoin-cash' }
export const dogecoinAssetMap = { [constants.dogeAssetId]: 'dogecoin' }
export const litecoinAssetMap = { [constants.ltcAssetId]: 'litecoin' }
export const cosmosAssetMap = { [constants.cosmosAssetId]: 'cosmos' }
export const osmosisAssetMap = { [constants.osmosisAssetId]: 'osmosis' }

interface Flavoring<FlavorT> {
  _type?: FlavorT
}

export type Nominal<T, FlavorT> = T & Flavoring<FlavorT>
