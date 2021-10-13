import {
  BuildSendTxInput,
  ChainTxType,
  ChainTypes,
  FeeDataEstimate,
  GetAddressInput,
  GetFeeDataInput,
  SignTxInput,
  TxHistoryResponse,
  ValidAddressResult
} from '@shapeshiftoss/types'
import { Account } from '@shapeshiftoss/types/src/types'

export const isChainAdapterOfType = <U extends ChainTypes>(
  chainType: U,
  x: ChainAdapter<ChainTypes>
): x is ChainAdapter<U> => {
  return x.getType() === chainType
}

export interface TxHistoryInput {
  /**
   * account address
   * @type {string}
   * @memberof V1ApiGetTxHistory
   */
  readonly pubkey: string
  /**
   * page number
   * @type {number}
   * @memberof V1ApiGetTxHistory
   */
  readonly page?: number
  /**
   * page size
   * @type {number}
   * @memberof V1ApiGetTxHistory
   */
  readonly pageSize?: number
  /**
   * filter by contract address (only supported by coins which support contracts)
   * @type {string}
   * @memberof V1ApiGetTxHistory
   */
  readonly contract?: string
}

export interface ChainAdapter<T extends ChainTypes> {
  /**
   * Get type of adapter
   */
  getType(): T

  /**
   * Get the balance of an address
   */
  getAccount(pubkey: string): Promise<Account<T>>
  getTxHistory(input: TxHistoryInput): Promise<TxHistoryResponse<T>>

  buildSendTransaction(
    input: BuildSendTxInput
  ): Promise<{ txToSign: ChainTxType<T>; estimatedFees: FeeDataEstimate }>

  getAddress(input: GetAddressInput): Promise<string>

  signTransaction(signTxInput: SignTxInput<ChainTxType<T>>): Promise<string>

  getFeeData(input: Partial<GetFeeDataInput>): Promise<FeeDataEstimate>

  broadcastTransaction(hex: string): Promise<string>

  validateAddress(address: string): Promise<ValidAddressResult>
}
