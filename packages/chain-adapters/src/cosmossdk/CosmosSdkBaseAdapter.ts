/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { CAIP2 } from '@shapeshiftoss/caip'
import { BIP44Params, chainAdapters, ChainTypes } from '@shapeshiftoss/types'

import { ChainAdapter as IChainAdapter } from '../api'
import { ChainAdapter } from '../bitcoin'

export type chainType = ChainTypes.Cosmos | ChainTypes.Osmosis

export interface ChainAdapterArgs {
  providers: {
    http: any
    ws: any
  }
}

export abstract class CosmosSdkBaseAdapter<T extends ChainTypes>
  implements IChainAdapter<chainType> {
  public static readonly defaultBIP44Params: BIP44Params = {
    purpose: 44,
    coinType: 118,
    accountNumber: 0
  }

  chainSpecificProperties: ChainAdapterArgs

  setChainSpecificProperties(args: ChainAdapterArgs) {
    this.chainSpecificProperties = args
  }

  getType(): CosmosChains {
    throw new Error('Method not implemented.')
  }
  getCaip2(): Promise<CAIP2> {
    throw new Error('Method not implemented.')
  }
  getAccount(pubkey: string): Promise<chainAdapters.Account<CosmosChains>> {
    throw new Error('Method not implemented.')
  }
  buildBIP44Params(params: Partial<BIP44Params>): BIP44Params {
    throw new Error('Method not implemented.')
  }
  getTxHistory(input: chainAdapters.TxHistoryInput): Promise<chainAdapters.TxHistoryResponse<CosmosChains>> {
    throw new Error('Method not implemented.')
  }

  buildSendTransaction(
    tx: chainAdapters.BuildSendTxInput<CosmosChains>
  ): Promise<{ txToSign: chainAdapters.ChainTxType<CosmosChains> }> {
    const {
      to,
      wallet,
      bip44Params = CosmosSdkBaseAdapter.defaultBIP44Params,
      chainSpecific: { gas },
      sendMax = false
    } = tx
    throw new Error('Method not implemented.')
  }

  getAddress(input: chainAdapters.GetAddressInput): Promise<string> {
    throw new Error('Method not implemented.')
  }
  signTransaction(
    signTxInput: chainAdapters.SignTxInput<chainAdapters.ChainTxType<T>>
  ): Promise<string> {
    throw new Error('Method not implemented.')
  }
  getFeeData(
    input: Partial<chainAdapters.GetFeeDataInput<T>>
  ): Promise<chainAdapters.FeeDataEstimate<T>> {
    throw new Error('Method not implemented.')
  }
  broadcastTransaction(hex: string): Promise<string> {
    throw new Error('Method not implemented.')
  }
  validateAddress(address: string): Promise<chainAdapters.ValidAddressResult> {
    throw new Error('Method not implemented.')
  }
  async subscribeTxs(
    input: chainAdapters.SubscribeTxsInput,
    onMessage: (msg: chainAdapters.SubscribeTxsMessage<CosmosChains>) => void,
    onError?: (err: chainAdapters.SubscribeError) => void
  ): Promise<void> {
    const { wallet, bip44Params = ChainAdapter.defaultBIP44Params } = input
    const address = await this.getAddress({ wallet, bip44Params })
  }
  unsubscribeTxs(input?: chainAdapters.SubscribeTxsInput): void {
    throw new Error('Method not implemented.')
  }
  closeTxs(): void {
    throw new Error('Method not implemented.')
  }
}
