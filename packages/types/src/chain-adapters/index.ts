import type { CAIP2, CAIP19 } from '@shapeshiftoss/caip'
import { BTCSignTx, CosmosSignTx, ETHSignTx, HDWallet } from '@shapeshiftoss/hdwallet-core'

import { BIP44Params, ChainAdapterType, SwapperType, UtxoAccountType } from '../base'
import { ChainAndSwapperSpecific, ChainSpecific } from '../utility'
import * as bitcoin from './bitcoin'
import * as cosmos from './cosmos'
import * as ethereum from './ethereum'
import * as osmosis from './osmosis'
export { bitcoin, cosmos, ethereum }

type ChainSpecificAccount<T> = ChainSpecific<
  T,
  {
    [ChainAdapterType.Ethereum]: ethereum.Account
    [ChainAdapterType.Bitcoin]: bitcoin.Account
    [ChainAdapterType.Cosmos]: cosmos.Account
    [ChainAdapterType.Osmosis]: osmosis.Account
  }
>

export type Account<T extends ChainAdapterType> = {
  balance: string
  /***
   * This is misnamed, and actually holds the "account specifier"; an xpub for UTXOs,
   * or an address for account-based coins.
   */
  pubkey: string
  assetId: CAIP19
  chainType: T
} & ChainSpecificAccount<T>

export type AssetBalance = {
  balance: string
  assetId: CAIP19
}

type ChainSpecificTransaction<T> = ChainSpecific<
  T,
  {
    [ChainAdapterType.Bitcoin]: bitcoin.TransactionSpecific
  }
>

export type Transaction<T extends ChainAdapterType> = {
  chainType: T
  symbol: string
  txid: string
  status: string
  from: string
  to?: string
  blockHash?: string
  blockHeight?: number
  confirmations?: number
  timestamp?: number
  value: string
  fee: string
} & ChainSpecificTransaction<T>

export enum FeeDataKey {
  Slow = 'slow',
  Average = 'average',
  Fast = 'fast'
}

type ChainSpecificQuoteFeeData<T1, T2> = ChainAndSwapperSpecific<
  T1,
  {
    [ChainAdapterType.Ethereum]: ethereum.QuoteFeeData
  },
  T2,
  {
    [SwapperType.Thorchain]: {
      receiveFee: string
    }
  }
>

type ChainSpecificFeeData<T> = ChainSpecific<
  T,
  {
    [ChainAdapterType.Ethereum]: ethereum.FeeData
    [ChainAdapterType.Bitcoin]: bitcoin.FeeData
    [ChainAdapterType.Cosmos]: cosmos.FeeData
  }
>

export type QuoteFeeData<T1 extends ChainAdapterType, T2 extends SwapperType> = {
  fee: string
} & ChainSpecificQuoteFeeData<T1, T2>

// ChainAdapterType.Ethereum:
// feePerUnit = gasPrice
// feePerTx = estimateGas (estimated transaction cost)
// feeLimit = gasLimit (max gas willing to pay)

// ChainAdapterType.Bitcoin:
// feePerUnit = sats/kbyte

export type FeeData<T extends ChainAdapterType> = {
  txFee: string
} & ChainSpecificFeeData<T>

export type FeeDataEstimate<T extends ChainAdapterType> = {
  [FeeDataKey.Slow]: FeeData<T>
  [FeeDataKey.Average]: FeeData<T>
  [FeeDataKey.Fast]: FeeData<T>
}

export type SubscribeTxsInput = {
  wallet: HDWallet
  bip44Params?: BIP44Params
  accountType?: UtxoAccountType
}

export type TxFee = {
  assetId: CAIP19
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

export type SubscribeTxsMessage<T extends ChainAdapterType> = {
  address: string
  blockHash?: string
  blockHeight: number
  blockTime: number
  chainType: T
  chainId: CAIP2
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
  assetId: CAIP19
  from: string
  to: string
  type: TxType
  value: string
}

export type SubscribeError = {
  message: string
}

export type TxHistoryResponse<T extends ChainAdapterType> = {
  page: number
  totalPages: number
  txs: number
  transactions: Array<Transaction<T>>
}

type ChainTxTypeInner = {
  [ChainAdapterType.Ethereum]: ETHSignTx
  [ChainAdapterType.Bitcoin]: BTCSignTx
  [ChainAdapterType.Cosmos]: CosmosSignTx
}

export type ChainTxType<T> = T extends keyof ChainTxTypeInner ? ChainTxTypeInner[T] : never

export type BuildSendTxInput<T extends ChainAdapterType> = {
  to: string
  value: string
  wallet: HDWallet
  bip44Params?: BIP44Params // TODO maybe these shouldnt be optional
  sendMax?: boolean
} & ChainSpecificBuildTxData<T>

type ChainSpecificBuildTxData<T> = ChainSpecific<
  T,
  {
    [ChainAdapterType.Ethereum]: ethereum.BuildTxInput
    [ChainAdapterType.Bitcoin]: bitcoin.BuildTxInput
    [ChainAdapterType.Cosmos]: cosmos.BuildTxInput
    [ChainAdapterType.Osmosis]: cosmos.BuildTxInput
  }
>

export type SignTxInput<TxType> = {
  txToSign: TxType
  wallet: HDWallet
}

export interface TxHistoryInput {
  readonly pubkey: string
  readonly page?: number
  readonly pageSize?: number
  readonly contract?: string
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
    [ChainAdapterType.Ethereum]: ethereum.GetFeeDataInput
    [ChainAdapterType.Bitcoin]: bitcoin.GetFeeDataInput
  }
>
export type GetFeeDataInput<T extends ChainAdapterType> = {
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
