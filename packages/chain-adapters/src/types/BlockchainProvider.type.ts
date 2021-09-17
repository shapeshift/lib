import { Params } from './Params.type'
import { TxHistoryResponse, FeeEstimateInput, AccountResponse, UtxoResponse } from '../api'
import { Bitcoin, Ethereum } from '@shapeshiftoss/unchained-client'

export interface BlockchainProvider {
  getAccount: (
    address: string
  ) => Promise<Bitcoin.BitcoinBalance | Ethereum.EthereumBalance | undefined>
  getTxHistory: (address: string, params?: Params) => Promise<TxHistoryResponse>
  getNonce: (address: string) => Promise<number>
  broadcastTx: (hex: string) => Promise<string>
  getFeePrice: () => Promise<string>
  getFeeUnits: (feeEstimateInput: FeeEstimateInput) => Promise<string>
  getUtxos: (account: string) => Promise<UtxoResponse | undefined>
}
