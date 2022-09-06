import { AssetId, ChainId } from '@shapeshiftoss/caip'
import { BIP44Params, UtxoAccountType } from '@shapeshiftoss/types'

import {
  Account,
  BuildSendTxInput,
  ChainTxType,
  FeeDataEstimate,
  GetAddressInput,
  GetBIP44ParamsInput,
  GetFeeDataInput,
  SignTxInput,
  SubscribeError,
  SubscribeTxsInput,
  Transaction,
  TxHistoryInput,
  TxHistoryResponse,
  ValidAddressResult,
} from './types'

/**
 * Type alias for a Map that can be used to manage instances of ChainAdapters
 */
export type ChainAdapterManager = Map<ChainId, ChainAdapter<ChainId>>

export type ChainAdapter<T extends ChainId> = {
  /**
   * A user-friendly name for the chain.
   */
  getDisplayName(): string
  getChainId(): ChainId

  /**
   * Base fee asset used to pay for txs on a given chain
   */
  getFeeAssetId(): AssetId

  /**
   * Get the supported account types for an adapter
   * For UTXO coins, that's the list of UTXO account types
   * For other networks, this is unimplemented, and left as a responsibility of the consumer.
   */
  getSupportedAccountTypes?(): Array<UtxoAccountType>
  /**
   * Get the balance of an address
   */
  getAccount(pubkey: string): Promise<Account<T>>

  buildBIP44Params(params: Partial<BIP44Params>): BIP44Params

  /**
   * Get BIP44Params for the given accountNumber and optional accountType
   */
  getBIP44Params(params: GetBIP44ParamsInput): BIP44Params

  getTxHistory(input: TxHistoryInput): Promise<TxHistoryResponse>

  buildSendTransaction(input: BuildSendTxInput<T>): Promise<{
    txToSign: ChainTxType<T>
  }>

  getAddress(input: GetAddressInput): Promise<string>

  signTransaction(signTxInput: SignTxInput<ChainTxType<T>>): Promise<string>

  signAndBroadcastTransaction?(signTxInput: SignTxInput<ChainTxType<T>>): Promise<string>

  getFeeData(input: Partial<GetFeeDataInput<T>>): Promise<FeeDataEstimate<T>>

  broadcastTransaction(hex: string): Promise<string>

  validateAddress(address: string): Promise<ValidAddressResult>

  subscribeTxs(
    input: SubscribeTxsInput,
    onMessage: (msg: Transaction) => void,
    onError?: (err: SubscribeError) => void,
  ): Promise<void>

  unsubscribeTxs(input?: SubscribeTxsInput): void

  closeTxs(): void
}
