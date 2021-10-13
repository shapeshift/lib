import { ContractTypes } from './base'

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

export enum FeeDataKey {
  Slow = 'slow',
  Average = 'average',
  Fast = 'fast'
}

export type FeeDataType = {
  feeUnitPrice: string
  networkFee: string
  feeUnits: string
}

export type FeeDataEstimate = {
  [FeeDataKey.Slow]: FeeDataType
  [FeeDataKey.Average]: FeeDataType
  [FeeDataKey.Fast]: FeeDataType
}

export type FeeData = {
  fee?: string
  gas?: string
  estimatedGas?: string
  gasPrice?: string
  approvalFee?: string
  protocolFee?: string
  minimumProtocolFee?: string
  receiveNetworkFee?: string
}
