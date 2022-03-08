import { HDWallet } from '@shapeshiftoss/hdwallet-core'
import { BigNumber } from 'bignumber.js'

export type Allowanceinput = {
  tokenContractAddress: string
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
