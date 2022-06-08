import { AssetId, ChainId } from '@shapeshiftoss/caip'
import { BIP44Params, UtxoAccountType } from '@shapeshiftoss/types'

import {
  Account,
  BuildSendTxInput,
  ChainTxType,
  FeeDataEstimate,
  GetAddressInput,
  GetFeeDataInput,
  SignTxInput,
  SubscribeError,
  SubscribeTxsInput,
  Transaction,
  TxHistoryInput,
  TxHistoryResponse,
  ValidAddressResult
} from './types'

export type ChainAdapter = {
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
  getAccount(pubkey: string): Promise<Account>

  buildBIP44Params(params: Partial<BIP44Params>): BIP44Params

  getTxHistory(input: TxHistoryInput): Promise<TxHistoryResponse>

  buildSendTransaction(input: BuildSendTxInput): Promise<{
    txToSign: ChainTxType
  }>

  getAddress(input: GetAddressInput): Promise<string>

  signTransaction(signTxInput: SignTxInput<ChainTxType>): Promise<string>

  signAndBroadcastTransaction?(signTxInput: SignTxInput<ChainTxType>): Promise<string>

  getFeeData(input: Partial<GetFeeDataInput>): Promise<FeeDataEstimate>

  broadcastTransaction(hex: string): Promise<string>

  validateAddress(address: string): Promise<ValidAddressResult>

  subscribeTxs(
    input: SubscribeTxsInput,
    onMessage: (msg: Transaction) => void,
    onError?: (err: SubscribeError) => void
  ): Promise<void>

  unsubscribeTxs(input?: SubscribeTxsInput): void

  closeTxs(): void
}
