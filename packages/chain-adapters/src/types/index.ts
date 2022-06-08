import { ChainNamespace } from '@shapeshiftoss/caip'
import { BTCSignTx, CosmosSignTx, ETHSignTx, HDWallet } from '@shapeshiftoss/hdwallet-core'
import { BIP44Params, ChainSpecific, UtxoAccountType } from '@shapeshiftoss/types'

import * as bitcoin from './bitcoin'
import * as cosmos from './cosmos'
import * as ethereum from './ethereum'

export { bitcoin, cosmos, ethereum }

type ChainSpecificAccount<T> = ChainSpecific<
  T,
  {
    eip155: ethereum.Account
    bip122: bitcoin.Account
    cosmos: cosmos.Account
  }
>

export type Account = {
  balance: string
  pubkey: string
  chainId: string
  assetId: string
}

export type AssetBalance = {
  balance: string
  assetId: string
}

export enum FeeDataKey {
  Slow = 'slow',
  Average = 'average',
  Fast = 'fast'
}

type ChainSpecificFeeData<T> = ChainSpecific<
  T,
  {
    eip155: ethereum.FeeData
    bip122: bitcoin.FeeData
    cosmos: cosmos.FeeData
  }
>

// ChainTypes.Ethereum:
// feePerUnit = gasPrice
// feePerTx = estimateGas (estimated transaction cost)
// feeLimit = gasLimit (max gas willing to pay)

// ChainTypes.Bitcoin:
// feePerUnit = sats/kbyte

export type FeeData = {
  txFee: string
}

export type FeeDataEstimate<T extends FeeData = FeeData> = {
  [FeeDataKey.Slow]: T
  [FeeDataKey.Average]: T
  [FeeDataKey.Fast]: T
}

export type SubscribeTxsInput = {
  wallet: HDWallet
  bip44Params?: BIP44Params
  accountType?: UtxoAccountType
}

export type TxFee = {
  assetId: string
  value: string
}

export enum TxType {
  Send = 'send',
  Receive = 'receive',
  Contract = 'contract',
  Unknown = 'unknown'
}

export enum TxStatus {
  Confirmed = 'confirmed',
  Pending = 'pending',
  Failed = 'failed',
  Unknown = 'unknown'
}

export type Transaction<T extends ChainNamespace> = {
  address: string
  blockHash?: string
  blockHeight: number
  blockTime: number
  chain: T
  chainId: string
  confirmations: number
  txid: string
  fee?: TxFee
  status: TxStatus
  tradeDetails?: TradeDetails
  transfers: Array<TxTransfer>
  data?: TxMetadata
}

export enum TradeType {
  Trade = 'trade',
  Refund = 'refund'
}

export type TradeDetails = {
  dexName: string
  memo?: string
  type: TradeType
}

export interface TxMetadata {
  method?: string
  parser: string
}

export type TxTransfer = {
  assetId: string
  from: string
  to: string
  type: TxType
  value: string
}

export type SubscribeError = {
  message: string
}

export type TxHistoryResponse = {
  cursor: string
  pubkey: string
  transactions: Array<Transaction<T>>
}

type ChainTxTypeInner = {
  eip155: ETHSignTx
  bip122: BTCSignTx
  cosmos: CosmosSignTx
}

export type ChainTxType<T> = T extends keyof ChainTxTypeInner ? ChainTxTypeInner[T] : never

export type BuildDelegateTxInput = {
  validator: string
  value: string
  wallet: HDWallet
  bip44Params?: BIP44Params
  memo?: string
}

export type BuildUndelegateTxInput<T extends ChainNamespace> = {
  validator: string
  value: string
  wallet: HDWallet
  bip44Params?: BIP44Params
  memo?: string
} & ChainSpecificBuildTxData<T>

export type BuildRedelegateTxInput = {
  fromValidator: string
  toValidator: string
  value: string
  wallet: HDWallet
  bip44Params?: BIP44Params
  memo?: string
}

export type BuildClaimRewardsTxInput = {
  validator: string
  wallet: HDWallet
  bip44Params?: BIP44Params
  memo?: string
}

export type BuildSendTxInput = {
  to: string
  value: string
  wallet: HDWallet
  bip44Params?: BIP44Params // TODO maybe these shouldnt be optional
  sendMax?: boolean
  memo?: string
}

export type SignTxInput<TxType> = {
  txToSign: TxType
  wallet: HDWallet
}

export interface TxHistoryInput {
  readonly cursor?: string
  readonly pubkey: string
  readonly pageSize?: number
}

export type GetAddressInputBase = {
  wallet: HDWallet
  bip44Params?: BIP44Params
  /**
   * Request that the address be shown to the user by the device, if supported
   */
  showOnDevice?: boolean
}

export type GetAddressInput = GetAddressInputBase | bitcoin.GetAddressInput

type ChainSpecificGetFeeDataInput<T> = ChainSpecific<
  T,
  {
    eip155: ethereum.GetFeeDataInput
    bip122: bitcoin.GetFeeDataInput
  }
>
export type GetFeeDataInput<T extends ChainNamespace> = {
  to: string
  value: string
  sendMax?: boolean
} & ChainSpecificGetFeeDataInput<T>

export enum ValidAddressResultType {
  Valid = 'valid',
  Invalid = 'invalid'
}

export type ValidAddressResult = {
  /** Is this Address valid */
  valid: boolean
  /** Result type of valid address */
  result: ValidAddressResultType
}

export type ZrxFeeResult = {
  fast: number
  instant: number
  low: number
  source:
    | 'ETH_GAS_STATION'
    | 'ETHERSCAN'
    | 'ETHERCHAIN'
    | 'GAS_NOW'
    | 'MY_CRYPTO'
    | 'UP_VEST'
    | 'GETH_PENDING'
    | 'MEDIAN'
    | 'AVERAGE'
  standard: number
  timestamp: number
}

export type ZrxGasApiResponse = {
  result: ZrxFeeResult[]
}
