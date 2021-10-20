import { ContractTypes } from '../base'

export type Account = {
  nonce: number
  tokens?: Array<Token>
}

export type Token = {
  balance: string
  contract: string
  precision: number
  name: string
  symbol: string
  contractType: ContractTypes
}

export type FeeData = {
  feePerTx: string
  feeLimit: string
}

export type QuoteFeeData = {
  /**
   * estimated gas units in gwei
   */
  estimatedGas?: string
  /**
   * gas price per gwei
   */
  gasPrice?: string
  /**
   * total approval fee in eth
   */
  approvalFee?: string
}
