/* eslint-disable prettier/prettier */
import { CAIP2 } from '@shapeshiftoss/caip'
import { BIP44Params, chainAdapters, ChainTypes } from '@shapeshiftoss/types'

import { ChainAdapter as IChainAdapter } from '../api'
import { CosmosSdkBaseAdapter } from './CosmosSdkBaseAdapter'
export class ChainAdapter extends CosmosSdkBaseAdapter<ChainTypes.Osmosis>
  implements IChainAdapter<ChainTypes.Osmosis> {

  public static readonly defaultBIP44Params: BIP44Params = {
    purpose: 44,
    coinType: 60,
    accountNumber: 0
  }

  getType(): ChainTypes.Osmosis {
    throw new Error('Method not implemented.')
  }
  getCaip2(): Promise<CAIP2> {
    throw new Error('Method not implemented.')
  }
  getAccount(pubkey: string): Promise<chainAdapters.Account<ChainTypes.Osmosis>> {
    return this.getAccount(pubkey)
  }
  buildBIP44Params(params: Partial<BIP44Params>): BIP44Params {
    return this.buildBIP44Params(params)
  }
  getTxHistory(input: chainAdapters.TxHistoryInput): Promise<chainAdapters.TxHistoryResponse<ChainTypes.Osmosis>> {
    return this.getTxHistory(input)
  }


  buildSendTransaction(
    tx: chainAdapters.BuildSendTxInput<ChainTypes.Osmosis>
  ): Promise<{ txToSign: chainAdapters.ChainTxType<ChainTypes.Osmosis> }> {
    return this.buildSendTransaction(tx)
  }


  getAddress(input: chainAdapters.GetAddressInput): Promise<string> {
    return this.getAddress(input)
  }
  signTransaction(signTxInput: chainAdapters.SignTxInput<chainAdapters.ChainTxType<ChainTypes.Osmosis>>): Promise<string> {
    return this.signTransaction(signTxInput)
  }
  getFeeData(
    input: Partial<chainAdapters.GetFeeDataInput<ChainTypes.Osmosis>>
  ): Promise<chainAdapters.FeeDataEstimate<ChainTypes.Osmosis>> {
    return this.getFeeData(input)
  }
  broadcastTransaction(hex: string): Promise<string> {
    return this.broadcastTransaction(hex)
  }
  validateAddress(address: string): Promise<chainAdapters.ValidAddressResult> {
    return this.validateAddress(address)
  }
  subscribeTxs(
    input: chainAdapters.SubscribeTxsInput,
    onMessage: (msg: chainAdapters.SubscribeTxsMessage<ChainTypes.Osmosis>) => void,
    onError?: (err: chainAdapters.SubscribeError) => void
  ): Promise<void> {
    return this.subscribeTxs(input, onMessage, onError)
  }
  unsubscribeTxs(input?: chainAdapters.SubscribeTxsInput): void {
    return this.unsubscribeTxs(input)
  }
  closeTxs(): void {
    return this.closeTxs()
  }
}
