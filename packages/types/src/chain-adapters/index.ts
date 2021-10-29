import { BTCInputScriptType, BTCSignTx, ETHSignTx, HDWallet } from '@shapeshiftoss/hdwallet-core'

import { BIP32Params, ChainTypes, NetworkTypesForChainType, SwapperType } from '../base'
import { ChainAndSwapperSpecific, ChainSpecific } from '../utility'
import * as bitcoin from './bitcoin'
import * as ethereum from './ethereum'

export { bitcoin, ethereum }

type ChainSpecificAccount<T extends ChainTypes> = ChainSpecific<
  T,
  {
    [ChainTypes.Ethereum]: ethereum.Account
    [ChainTypes.Bitcoin]: bitcoin.Account
  }
>

export type Account<T extends ChainTypes> = {
  balance: string
  pubkey: string
  symbol: string
  chain: T
  network: NetworkTypesForChainType<T>
} & ChainSpecificAccount<T>

type ChainSpecificTransaction<T extends ChainTypes> = ChainSpecific<
  T,
  {
    [ChainTypes.Bitcoin]: bitcoin.TransactionSpecific
  }
>

export type Transaction<T extends ChainTypes> = {
  network: NetworkTypesForChainType<T>
  chain: T
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

type ChainSpecificQuoteFeeData<
  C extends ChainTypes,
  S extends SwapperType
> = ChainAndSwapperSpecific<
  C,
  {
    [ChainTypes.Ethereum]: ethereum.QuoteFeeData
  },
  S,
  {
    [SwapperType.Thorchain]: {
      receiveFee: string
    }
  }
>

type ChainSpecificFeeData<T extends ChainTypes> = ChainSpecific<
  T,
  {
    [ChainTypes.Ethereum]: ethereum.FeeData
  }
>

export type QuoteFeeData<S extends SwapperType, C extends ChainTypes> = {
  fee: string
} & ChainSpecificQuoteFeeData<C, S>

// ChainTypes.Ethereum:
// feePerUnit = gasPrice
// feePerTx = estimateGas (estimated transaction cost)
// feeLimit = gasLimit (max gas willing to pay)

// ChainTypes.Bitcoin:
// feePerUnit = sats/kbyte

export type FeeData<T extends ChainTypes> = {
  feePerUnit: string
} & ChainSpecificFeeData<T>

export type FeeDataEstimate<T extends ChainTypes> = {
  [FeeDataKey.Slow]: FeeData<T>
  [FeeDataKey.Average]: FeeData<T>
  [FeeDataKey.Fast]: FeeData<T>
}

export type SubscribeTxsInput = {
  addresses: Array<string>
}

export type TxFee = {
  symbol: string
  value: string
}

export enum TxType {
  send = 'send',
  receive = 'receive'
}

export enum TxStatus {
  confirmed = 'confirmed',
  pending = 'pending',
  failed = 'failed'
}

export type SubscribeTxsMessage<T extends ChainTypes> = {
  address: string
  blockHash?: string
  blockHeight: number
  blockTime: number
  chain: T
  confirmations: number
  network: NetworkTypesForChainType<T>
  txid: string
  to?: string
  from?: string
  fee?: TxFee
  status: TxStatus
} & TxTransfer<T>

type ChainSpecificTxTransfer<T extends ChainTypes> = ChainSpecific<
  T,
  {
    [ChainTypes.Ethereum]: ethereum.TxTransfer
  }
>

export type TxTransfer<T extends ChainTypes> = {
  asset: string
  type: TxType
  value: string
} & ChainSpecificTxTransfer<T>

export type SubscribeError = {
  message: string
}

export type TxHistoryResponse<T extends ChainTypes> = {
  page: number
  totalPages: number
  txs: number
  transactions: Array<Transaction<T>>
}

type ChainTxTypeInner = {
  [ChainTypes.Ethereum]: ETHSignTx
  [ChainTypes.Bitcoin]: BTCSignTx
}

export type ChainTxType<T extends ChainTypes> = T extends keyof ChainTxTypeInner
  ? ChainTxTypeInner[T]
  : never

export type BuildSendTxInput = {
  to?: string
  value?: string
  wallet: HDWallet
  /** In base units **/
  fee?: string
  /** Optional param for eth txs indicating what ERC20 is being sent **/
  erc20ContractAddress?: string
  recipients?: Array<bitcoin.Recipient>
  opReturnData?: string
  scriptType?: BTCInputScriptType
  gasLimit?: string
  bip32Params?: BIP32Params
  feeSpeed?: FeeDataKey
}

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
  bip32Params?: BIP32Params
}

export type GetAddressInput = GetAddressInputBase | bitcoin.GetAddressInput

export type GetFeeDataInput = {
  contractAddress?: string
  from: string
  to: string
  value: string
}

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
