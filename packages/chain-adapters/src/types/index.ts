import {
  BTCSignTx,
  CosmosSignTx,
  ETHSignTx,
  HDWallet,
  OsmosisSignTx
} from '@shapeshiftoss/hdwallet-core'
import {
  BIP44Params,
  ChainSpecific,
  SUPPORTED_CHAIN_IDS,
  SupportedChainIds,
  UtxoAccountType
} from '@shapeshiftoss/types'

import * as bitcoin from './bitcoin'
import * as cosmos from './cosmos'
import * as ethereum from './ethereum'
import * as osmosis from './osmosis'

export { bitcoin, cosmos, ethereum }

type ChainSpecificAccount<T> = ChainSpecific<
  T,
  {
    [SUPPORTED_CHAIN_IDS.EthereumMainnet]: ethereum.Account
    [SUPPORTED_CHAIN_IDS.BitcoinMainnet]: bitcoin.Account
    [SUPPORTED_CHAIN_IDS.CosmosMainnet]: cosmos.Account
    [SUPPORTED_CHAIN_IDS.OsmosisMainnet]: osmosis.Account
  }
>

export type Account<T extends SupportedChainIds> = {
  balance: string
  pubkey: string
  chainId: string
  assetId: string
  chain: T
} & ChainSpecificAccount<T>

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
    [SUPPORTED_CHAIN_IDS.EthereumMainnet]: ethereum.FeeData
    [SUPPORTED_CHAIN_IDS.BitcoinMainnet]: bitcoin.FeeData
    [SUPPORTED_CHAIN_IDS.CosmosMainnet]: cosmos.FeeData
    [SUPPORTED_CHAIN_IDS.OsmosisMainnet]: osmosis.FeeData
  }
>

// ChainTypes.Ethereum:
// feePerUnit = gasPrice
// feePerTx = estimateGas (estimated transaction cost)
// feeLimit = gasLimit (max gas willing to pay)

// ChainTypes.Bitcoin:
// feePerUnit = sats/kbyte

export type FeeData<T extends SupportedChainIds> = {
  txFee: string
} & ChainSpecificFeeData<T>

export type FeeDataEstimate<T extends SupportedChainIds> = {
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

export type Transaction<T extends SupportedChainIds> = {
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

export type TxHistoryResponse<T extends SupportedChainIds> = {
  cursor: string
  pubkey: string
  transactions: Array<Transaction<T>>
}

type ChainTxTypeInner = {
  [SUPPORTED_CHAIN_IDS.EthereumMainnet]: ETHSignTx
  [SUPPORTED_CHAIN_IDS.BitcoinMainnet]: BTCSignTx
  [SUPPORTED_CHAIN_IDS.CosmosMainnet]: CosmosSignTx
  [SUPPORTED_CHAIN_IDS.OsmosisMainnet]: OsmosisSignTx
}

export type ChainTxType<T> = T extends keyof ChainTxTypeInner ? ChainTxTypeInner[T] : never

export type BuildDelegateTxInput<T extends SupportedChainIds> = {
  validator: string
  value: string
  wallet: HDWallet
  bip44Params?: BIP44Params
  memo?: string
} & ChainSpecificBuildTxData<T>

export type BuildUndelegateTxInput<T extends SupportedChainIds> = {
  validator: string
  value: string
  wallet: HDWallet
  bip44Params?: BIP44Params
  memo?: string
} & ChainSpecificBuildTxData<T>

export type BuildRedelegateTxInput<T extends SupportedChainIds> = {
  fromValidator: string
  toValidator: string
  value: string
  wallet: HDWallet
  bip44Params?: BIP44Params
  memo?: string
} & ChainSpecificBuildTxData<T>

export type BuildClaimRewardsTxInput<T extends SupportedChainIds> = {
  validator: string
  wallet: HDWallet
  bip44Params?: BIP44Params
  memo?: string
} & ChainSpecificBuildTxData<T>

export type BuildSendTxInput<T extends SupportedChainIds> = {
  to: string
  value: string
  wallet: HDWallet
  bip44Params?: BIP44Params // TODO maybe these shouldnt be optional
  sendMax?: boolean
  memo?: string
} & ChainSpecificBuildTxData<T>

type ChainSpecificBuildTxData<T> = ChainSpecific<
  T,
  {
    [SUPPORTED_CHAIN_IDS.EthereumMainnet]: ethereum.BuildTxInput
    [SUPPORTED_CHAIN_IDS.BitcoinMainnet]: bitcoin.BuildTxInput
    [SUPPORTED_CHAIN_IDS.CosmosMainnet]: cosmos.BuildTxInput
    [SUPPORTED_CHAIN_IDS.OsmosisMainnet]: cosmos.BuildTxInput
  }
>

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
    [SUPPORTED_CHAIN_IDS.EthereumMainnet]: ethereum.GetFeeDataInput
    [SUPPORTED_CHAIN_IDS.BitcoinMainnet]: bitcoin.GetFeeDataInput
  }
>
export type GetFeeDataInput<T extends SupportedChainIds> = {
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
