import { HDWallet } from '@shapeshiftoss/hdwallet-core'
import { BigNumber } from 'bignumber.js'

import { WithdrawType } from '../constants'

export type Allowanceinput = {
  tokenContractAddress: string
  contractAddress: string
  userAddress: string
}

export type ApproveInput = {
  accountNumber?: number
  dryRun?: boolean
  tokenContractAddress: string
  contractAddress: string
  userAddress: string
  wallet: HDWallet
}

export type EstimateGasApproveInput = Pick<
  ApproveInput,
  'userAddress' | 'tokenContractAddress' | 'contractAddress'
>

export type TxInput = {
  accountNumber?: number
  dryRun?: boolean
  tokenContractAddress?: string
  userAddress: string
  contractAddress: string
  wallet: HDWallet
  amountDesired: BigNumber
}

export type WithdrawInput = Omit<TxInput, 'amountDesired'> & {
  type: WithdrawType
  amountDesired?: BigNumber
}

export type FoxyOpportunityInputData = {
  tvl: BigNumber
  apy: string
  expired: boolean
  staking: string
  foxy: string
  fox: string
  liquidityReserve: string
}

export type EstimateGasTxInput = Pick<
  TxInput,
  'tokenContractAddress' | 'contractAddress' | 'userAddress' | 'amountDesired'
>

export type BalanceInput = {
  userAddress: string
  tokenContractAddress: string
}

export type TVLInput = {
  tokenContractAddress: string
}

export type InstantUnstakeFeeInput = {
  contractAddress: string
}
