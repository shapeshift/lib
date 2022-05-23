import { ChainId } from '../chainId/chainId'
import { CHAIN_NAMESPACE } from '../constants'
import { assertIsValidChainId, isValidChainId } from '../utils'

export type AccountId = string

type ToAccountIdArgs = {
  chainId: ChainId
  account: string
}

type ToAccountId = (args: ToAccountIdArgs) => AccountId

export const toAccountId: ToAccountId = ({ chainId, account }) => {
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
  chainId: string
  account: string
}

type FromAccountId = (accountId: string) => FromAccountIdReturn

export const fromAccountId: FromAccountId = (accountId) => {
  const parts = accountId.split(':')

  if (parts.length !== 3) {
    throw new Error(`fromAccountId: invalid AccountId ${accountId}`)
  }

  const chainId = parts.slice(0, 2).join(':')
  isValidChainId(chainId)
  const account = parts[2]

  if (!account) {
    throw new Error(`fromAccountId: account required`)
  }

  const [namespace] = chainId.split(':')

  // we lowercase eth accounts as per the draft spec
  // it's not explicit, but cHecKsUM can be recovered from lowercase eth accounts
  // we don't lowercase bitcoin addresses as they'll fail checksum
  const outputAccount = namespace === CHAIN_NAMESPACE.Ethereum ? account.toLowerCase() : account

  return { chainId, account: outputAccount }
}

export const toCAIP10 = toAccountId
export const fromCAIP10 = fromAccountId
