import axios, { AxiosInstance } from 'axios'
import { Params } from '../types/Params.type'
import { BlockchainProvider } from '../types/BlockchainProvider.type'
import {
  ChainTypes,
  TxHistoryResponse,
  BalanceResponse,
  BroadcastTxResponse,
  FeeEstimateInput
} from '@shapeshiftoss/types'
import https from 'https'

const axiosClient = (baseURL: string) =>
  axios.create({
    baseURL,
    // Local development doesn't require tls
    httpsAgent: new https.Agent({
      rejectUnauthorized: process.env.NODE_ENV === 'development' ? false : true
    })
  })

export const isUnchainedProviderOfType = <U extends ChainTypes>(
  chainType: U,
  x: UnchainedProvider<ChainTypes>
): x is UnchainedProvider<U> => {
  return x.getType() === chainType
}

export interface UnchainedProviderFactory<T extends ChainTypes> {
  new (baseURL: string): UnchainedProvider<T>
}

type UnchainedProviderDeps<T> = {
  baseURL: string
  type: T
}

export class UnchainedProvider<T extends ChainTypes> implements BlockchainProvider<T> {
  axios: AxiosInstance
  type: T

  constructor({ baseURL, type }: UnchainedProviderDeps<T>) {
    this.axios = axiosClient(baseURL)
    this.type = type
  }

  getType(): T {
    return this.type
  }

  async getBalance(address: string): Promise<BalanceResponse<T> | undefined> {
    const { data } = await this.axios.get<BalanceResponse<T>>(`/balance/${address}`)
    return data
  }

  async getTxHistory(address: string, params?: Params) {
    const { data } = await this.axios.get<TxHistoryResponse<T>>(`/account/${address}/txs`, {
      params: params
    })
    return data
  }

  async getNonce(address: string): Promise<number> {
    const { data } = await this.axios.get<number>(`/nonce/${address}`)
    return data
  }

  async broadcastTx(hex: string): Promise<string> {
    const { data } = await this.axios.post<BroadcastTxResponse>('/send', {
      hex
    })

    return data.txid
  }

  async getFeePrice(): Promise<string> {
    const { data } = await this.axios.get<string>(`/feeprice`)
    return data
  }

  async getFeeUnits(feeEstimateInput: FeeEstimateInput): Promise<string> {
    const { data } = await this.axios.get<string>(`/estimateGas`, {
      params: feeEstimateInput
    })
    return data
  }
}
