import {
  BalanceResponse,
  BuildSendTxInput,
  ChainTxType,
  ChainTypes,
  FeeDataEstimate,
  GetAddressInput,
  GetFeeDataInput,
  SignTxInput,
  ValidAddressResult
} from '@shapeshiftoss/types'
import { BlockchainProvider } from './types/BlockchainProvider.type'

export const isChainAdapterOfType = <U extends ChainTypes>(
  chainType: U,
  x: ChainAdapter<ChainTypes>
): x is ChainAdapter<U> => {
  return x.getType() === chainType
}

export interface ChainAdapterFactory<T extends ChainTypes> {
  new ({ provider }: { provider: BlockchainProvider<T> }): ChainAdapter<T>
}

export interface ChainAdapter<T extends ChainTypes> {
  /**
   * Get type of adapter
   */
  getType(): T

  /**
   * Get the balance of an address
   */
  getBalance(address: string): Promise<BalanceResponse<T> | undefined>

  buildSendTransaction(
    input: BuildSendTxInput
  ): Promise<{ txToSign: ChainTxType<T>; estimatedFees: FeeDataEstimate }>

  getAddress(input: GetAddressInput): Promise<string>

  signTransaction(signTxInput: SignTxInput<ChainTxType<T>>): Promise<string>

  getFeeData(input: Partial<GetFeeDataInput>): Promise<FeeDataEstimate>

  broadcastTransaction(hex: string): Promise<string>

  validateAddress(address: string): Promise<ValidAddressResult>
}
