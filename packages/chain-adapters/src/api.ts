import {
  BIP32Params,
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

//TODO(0xdef1cafe): write tests and abstract to utils package
export const toPath = (bip32Params: BIP32Params): string => {
  const { purpose, coinType, accountNumber, isChange, index } = bip32Params
  return `m/${purpose}'/${coinType}'/${accountNumber}'/${Number(isChange)}/${index}`
}

//TODO(0xdef1cafe): write tests and abstract to utils package
export const fromPath = (path: string): BIP32Params => {
  const parts = path.split('/')
  parts.slice(1, parts.length - 1) // discard the m/
  const partsWithoutPrimes = parts.map((part) => part.replace("'", '')) // discard harderning
  const [purpose, coinType, accountNumber, isChangeNumber, index] = partsWithoutPrimes.map(Number)
  const isChange = Boolean(isChangeNumber)
  return { purpose, coinType, accountNumber, isChange, index }
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
  getAccount(pubkey: string): Promise<Account>
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
