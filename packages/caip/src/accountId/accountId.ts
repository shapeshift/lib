import { ChainId, ChainNamespace, ChainReference, toChainId } from '../chainId/chainId'
import { CHAIN_NAMESPACE } from '../constants'
import { assertIsChainNamespace, assertIsChainReference, assertIsValidChainId } from '../utils'

export type AccountId = string

type ToAccountIdArgs =
  | {
      chainId?: never
      account: string
      chainNamespace: ChainNamespace
      chainReference: ChainReference
    }
  | {
      chainId: ChainId
      account: string
      chainNamespace?: never
      chainReference?: never
    }

type ToAccountId = (args: ToAccountIdArgs) => AccountId

export const toAccountId: ToAccountId = ({
  chainId: maybeChainId,
  chainNamespace,
  chainReference,
  account
}) => {
  const chainId = maybeChainId ?? toChainId({ chainNamespace, chainReference })
  assertIsValidChainId(chainId)

  if (!account) {
    throw new Error(`toAccountId: account is required`)
  }

  const [namespace] = chainId.split(':')

  // we lowercase eth accounts as per the draft spec
  // it's not explicit, but cHecKsUM can be recovered from lowercase eth accounts
  // we don't lowercase bitcoin addresses as they'll fail checksum
  const outputAccount = namespace === CHAIN_NAMESPACE.Ethereum ? account.toLowerCase() : account

  return `${chainId}:${outputAccount}`
}

type FromAccountIdReturn = {
  chainId: ChainId
  account: string
  chainNamespace: ChainNamespace
  chainReference: ChainReference
}

type FromAccountId = (accountId: AccountId) => FromAccountIdReturn

export const fromAccountId: FromAccountId = (accountId) => {
  const parts = accountId.split(':')

  if (parts.length !== 3) {
    throw new Error(`fromAccountId: invalid AccountId ${accountId}`)
  }

  const chainNamespace = parts[0]
  const chainReference = parts[1]
  const chainId = parts.slice(0, 2).join(':')
  assertIsChainNamespace(chainNamespace)
  assertIsChainReference(chainReference)
  assertIsValidChainId(chainId)

  const account = parts[2]
  if (!account) {
    throw new Error(`fromAccountId: account required`)
  }

  // we lowercase eth accounts as per the draft spec
  // it's not explicit, but cHecKsUM can be recovered from lowercase eth accounts
  // we don't lowercase bitcoin addresses as they'll fail checksum
  const outputAccount =
    chainNamespace === CHAIN_NAMESPACE.Ethereum ? account.toLowerCase() : account

  return { chainId, account: outputAccount, chainNamespace, chainReference }
}

export const toCAIP10 = toAccountId
export const fromCAIP10 = fromAccountId
