import { HDWallet } from '@shapeshiftoss/hdwallet-core'
import { BIP44Params } from '@shapeshiftoss/types'
import * as unchained from '@shapeshiftoss/unchained-client'

import { ChainSpecificBuildTxData } from '../types'
import { CosmosSdkChainId } from './CosmosSdkBaseAdapter'

export type Account = {
  sequence: string
  accountNumber: string
  delegations: Delegation[]
  redelegations: Redelegation[]
  undelegations: Undelegation[]
  rewards: ValidatorReward[]
}

export type Message = {
  type: string
  value: Record<string, unknown>
}

export type BuildTransactionInput<T extends CosmosSdkChainId> = {
  from: string
  value?: string
  wallet: HDWallet
  bip44Params: BIP44Params
  msg: Message
  sendMax?: boolean
  memo?: string
} & ChainSpecificBuildTxData<T>

export type BuildTxInput = {
  gas: string
  fee: string
}

export type Info = {
  totalSupply: string
  bondedTokens: string
}

export type Validator = {
  address: string
  moniker: string
  tokens?: string
  apr: string
  commission: string
}

export type Delegation = {
  assetId: string
  amount: string
  validator: Validator
}

export type RedelegationEntry = {
  assetId: string
  completionTime: number
  amount: string
}

export type Redelegation = {
  destinationValidator: Validator
  sourceValidator: Validator
  entries: RedelegationEntry[]
}

export type UndelegationEntry = {
  assetId: string
  completionTime: number
  amount: string
}

export type Undelegation = {
  validator: Validator
  entries: UndelegationEntry[]
}

export type Reward = {
  assetId: string
  amount: string
}

export type ValidatorReward = {
  validator: Validator
  rewards: Reward[]
}

export type FeeData = {
  gasLimit: string
}

export type TransactionMetadata = unchained.cosmossdk.TxMetadata
