import { HDWallet, BTCInputScriptType, BTCSignTx, ETHSignTx } from '@shapeshiftoss/hdwallet-core'
import { BIP32Params, ChainTypes, NetworkTypes } from '../base'
import { ChainSpecificFlat, ChainSpecificNested } from '../utility'
import * as Ethereum from './ethereum'
import * as Bitcoin from './bitcoin'

export { Bitcoin, Ethereum }

type ChainSpecificAccount<T> = ChainSpecificFlat<
  T,
  {
    [ChainTypes.Ethereum]: Ethereum.Account
    [ChainTypes.Bitcoin]: Bitcoin.Account
  }
>

export type Account<T extends ChainTypes> = {
  balance: string
  pubkey: string
  symbol: string
  chain: T
  network: NetworkTypes
} & ChainSpecificAccount<T>

type ChainSpecificTransaction<T> = ChainSpecificNested<
  T,
  {
    [ChainTypes.Bitcoin]: Bitcoin.TransactionSpecific
  }
>

type Transaction<T extends ChainTypes> = {
  network: NetworkTypes
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

export type ChainTxType<T> = T extends keyof ChainTxTypeInner ? ChainTxTypeInner[T] : never

export type BuildSendTxInput = {
  to?: string
  value?: string
  wallet: HDWallet
  /** In base units **/
  fee?: string
  /** Optional param for eth txs indicating what ERC20 is being sent **/
  erc20ContractAddress?: string
  recipients?: Array<Bitcoin.Recipient>
  opReturnData?: string
  scriptType?: BTCInputScriptType
  gasLimit?: string
  bip32Params: BIP32Params
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

export type GetAddressInput = GetAddressInputBase | Bitcoin.GetAddressInput

export type GetFeeDataInput = {
  contractAddress?: string
  from: string
  to: string
  value: string
}

export enum FeeDataKey {
  Slow = 'slow',
  Average = 'average',
  Fast = 'fast'
}

export type FeeDataEstimate = Ethereum.FeeDataEstimate | Bitcoin.FeeDataEstimate

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
