import { ChainId } from '@shapeshiftoss/caip'
import {
  BTCSignTx,
  CosmosSignTx,
  ETHSignTx,
  HDWallet,
  OsmosisSignTx
} from '@shapeshiftoss/hdwallet-core'
import { BIP44Params, ChainSpecific, KnownChainIds, UtxoAccountType } from '@shapeshiftoss/types'
import * as unchained from '@shapeshiftoss/unchained-client'

import * as cosmos from './cosmossdk/cosmos'
import * as osmosis from './cosmossdk/osmosis'
import * as evm from './evm/types'
import * as utxo from './utxo/types'

type ChainSpecificAccount<T> = ChainSpecific<
  T,
  {
    [KnownChainIds.EthereumMainnet]: evm.Account
    [KnownChainIds.AvalancheMainnet]: evm.Account
    [KnownChainIds.BitcoinMainnet]: utxo.Account
    [KnownChainIds.BitcoinCashMainnet]: utxo.Account
    [KnownChainIds.DogecoinMainnet]: utxo.Account
    [KnownChainIds.LitecoinMainnet]: utxo.Account
    [KnownChainIds.CosmosMainnet]: cosmos.Account
    [KnownChainIds.OsmosisMainnet]: osmosis.Account
  }
>

export type Account<T extends ChainId> = {
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
    [KnownChainIds.EthereumMainnet]: evm.FeeData
    [KnownChainIds.AvalancheMainnet]: evm.FeeData
    [KnownChainIds.BitcoinMainnet]: utxo.FeeData
    [KnownChainIds.BitcoinCashMainnet]: utxo.FeeData
    [KnownChainIds.DogecoinMainnet]: utxo.FeeData
    [KnownChainIds.LitecoinMainnet]: utxo.FeeData
    [KnownChainIds.CosmosMainnet]: cosmos.FeeData
    [KnownChainIds.OsmosisMainnet]: osmosis.FeeData
  }
>

export type FeeData<T extends ChainId> = {
  txFee: string
} & ChainSpecificFeeData<T>

export type GasFeeData = Omit<evm.FeeData, 'gasLimit'>

export type GasFeeDataEstimate = {
  [FeeDataKey.Fast]: GasFeeData
  [FeeDataKey.Average]: GasFeeData
  [FeeDataKey.Slow]: GasFeeData
}

export type FeeDataEstimate<T extends ChainId> = {
  [FeeDataKey.Slow]: FeeData<T>
  [FeeDataKey.Average]: FeeData<T>
  [FeeDataKey.Fast]: FeeData<T>
}

export type SubscribeTxsInput = {
  wallet: HDWallet
  bip44Params?: BIP44Params
  accountType?: UtxoAccountType
}

export type TransferType = unchained.TransferType
export type TradeType = unchained.TradeType

export type Transaction = Omit<unchained.StandardTx, 'transfers'> & {
  transfers: Array<TxTransfer>
  data?: unchained.StandardTxMetadata | unchained.evm.TxMetadata | unchained.cosmos.TxMetadata
}

export type TransactionMetadataStandard = unchained.StandardTxMetadata
export type TransactionMetadataEvm = unchained.evm.ERC20TxMetadata
export type TransactionMetadataCosmos = unchained.cosmos.TxMetadata

export type TxTransfer = Omit<unchained.Transfer, 'components' | 'totalValue' | 'token'> & {
  value: string
}

export type SubscribeError = {
  message: string
}

export type TxHistoryResponse = {
  cursor: string
  pubkey: string
  transactions: Array<Transaction>
}

type ChainTxTypeInner = {
  [KnownChainIds.EthereumMainnet]: ETHSignTx
  [KnownChainIds.AvalancheMainnet]: ETHSignTx
  [KnownChainIds.BitcoinMainnet]: BTCSignTx
  [KnownChainIds.BitcoinCashMainnet]: BTCSignTx
  [KnownChainIds.DogecoinMainnet]: BTCSignTx
  [KnownChainIds.LitecoinMainnet]: BTCSignTx
  [KnownChainIds.CosmosMainnet]: CosmosSignTx
  [KnownChainIds.OsmosisMainnet]: OsmosisSignTx
}

export type ChainTxType<T> = T extends keyof ChainTxTypeInner ? ChainTxTypeInner[T] : never

export type BuildDelegateTxInput<T extends ChainId> = {
  validator: string
  value: string
  wallet: HDWallet
  bip44Params?: BIP44Params
  memo?: string
} & ChainSpecificBuildTxData<T>

export type BuildUndelegateTxInput<T extends ChainId> = {
  validator: string
  value: string
  wallet: HDWallet
  bip44Params?: BIP44Params
  memo?: string
} & ChainSpecificBuildTxData<T>

export type BuildRedelegateTxInput<T extends ChainId> = {
  fromValidator: string
  toValidator: string
  value: string
  wallet: HDWallet
  bip44Params?: BIP44Params
  memo?: string
} & ChainSpecificBuildTxData<T>

export type BuildClaimRewardsTxInput<T extends ChainId> = {
  validator: string
  wallet: HDWallet
  bip44Params?: BIP44Params
  memo?: string
} & ChainSpecificBuildTxData<T>

export type BuildSendTxInput<T extends ChainId> = {
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
    [KnownChainIds.EthereumMainnet]: evm.BuildTxInput
    [KnownChainIds.AvalancheMainnet]: evm.BuildTxInput
    [KnownChainIds.BitcoinMainnet]: utxo.BuildTxInput
    [KnownChainIds.BitcoinCashMainnet]: utxo.BuildTxInput
    [KnownChainIds.DogecoinMainnet]: utxo.BuildTxInput
    [KnownChainIds.LitecoinMainnet]: utxo.BuildTxInput
    [KnownChainIds.CosmosMainnet]: cosmos.BuildTxInput
    [KnownChainIds.OsmosisMainnet]: cosmos.BuildTxInput
  }
>

export type SignTxInput<TxType> = {
  txToSign: TxType
  wallet: HDWallet
}

export type SignMessageInput<MessageType> = {
  messageToSign: MessageType
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

export type GetAddressInput = GetAddressInputBase | utxo.GetAddressInput

type ChainSpecificGetFeeDataInput<T> = ChainSpecific<
  T,
  {
    [KnownChainIds.EthereumMainnet]: evm.GetFeeDataInput
    [KnownChainIds.AvalancheMainnet]: evm.GetFeeDataInput
    [KnownChainIds.BitcoinMainnet]: utxo.GetFeeDataInput
    [KnownChainIds.BitcoinCashMainnet]: utxo.GetFeeDataInput
    [KnownChainIds.DogecoinMainnet]: utxo.GetFeeDataInput
    [KnownChainIds.LitecoinMainnet]: utxo.GetFeeDataInput
  }
>
export type GetFeeDataInput<T extends ChainId> = {
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
