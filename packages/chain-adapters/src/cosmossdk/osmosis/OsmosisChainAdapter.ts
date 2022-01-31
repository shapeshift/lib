/* eslint-disable prettier/prettier */
import { bip32ToAddressNList, OsmosisSignTx, OsmosisWallet } from '@shapeshiftoss/hdwallet-core'
import { CAIP2 } from '@shapeshiftoss/caip'
import { BIP44Params, chainAdapters, ChainTypes, NetworkTypes } from '@shapeshiftoss/types'
import { toPath } from '../../utils'
import { ErrorHandler } from '../../error/ErrorHandler'
import { ChainAdapter as IChainAdapter } from '../../api'
import { ChainAdapterArgs, CosmosSdkBaseAdapter } from '../CosmosSdkBaseAdapter'
export class ChainAdapter extends CosmosSdkBaseAdapter<ChainTypes.Osmosis>
  implements IChainAdapter<ChainTypes.Osmosis> {
  public static readonly defaultBIP44Params: BIP44Params = {
    purpose: 44,
    coinType: 118,
    accountNumber: 0
  }

  constructor(args: ChainAdapterArgs) {
    super()
    this.setChainSpecificProperties(args)
  }

  getType(): ChainTypes.Osmosis {
    return ChainTypes.Osmosis
  }

  async getAddress(input: chainAdapters.GetAddressInput): Promise<string> {
    const { wallet, bip44Params = ChainAdapter.defaultBIP44Params } = input
    const path = toPath(bip44Params)
    const addressNList = bip32ToAddressNList(path)
    const osmosisAddress = await (wallet as OsmosisWallet).osmosisGetAddress({
      addressNList,
      showDisplay: Boolean(input.showOnDevice)
    })
    return osmosisAddress as string
  }

  async signTransaction(signTxInput: chainAdapters.SignTxInput<OsmosisSignTx>): Promise<string> {
    try {
      const { txToSign, wallet } = signTxInput
      const signedTx = await (wallet as OsmosisWallet).osmosisSignTx(txToSign)

      if (!signedTx) throw new Error('Error signing tx')

      // Make generic or union type for signed transactions and return
      return JSON.stringify(signedTx)
    } catch (err) {
      return ErrorHandler(err)
    }
  }

  // getCaip2(): Promise<CAIP2> {
  //   throw new Error('Method not implemented.')
  // }
  // getAccount(pubkey: string): Promise<chainAdapters.Account<ChainTypes.Osmosis>> {
  //   return this.getAccount(pubkey)
  // }
  // buildBIP44Params(params: Partial<BIP44Params>): BIP44Params {
  //   return this.buildBIP44Params(params)
  // }
  // getTxHistory(
  //   input: chainAdapters.TxHistoryInput
  // ): Promise<chainAdapters.TxHistoryResponse<ChainTypes.Osmosis>> {
  //   return this.getTxHistory(input)
  // }

  // buildSendTransaction(
  //   tx: chainAdapters.BuildSendTxInput<ChainTypes.Osmosis>
  // ): Promise<{ txToSign: chainAdapters.ChainTxType<ChainTypes.Osmosis> }> {
  //   return this.buildSendTransaction(tx)
  // }

  // getAddress(input: chainAdapters.GetAddressInput): Promise<string> {
  //   return this.getAddress(input)
  // }
  // signTransaction(signTxInput: chainAdapters.SignTxInput<chainAdapters.ChainTxType<ChainTypes.Osmosis>>): Promise<string> {
  //   return this.signTransaction(signTxInput)
  // }
  // getFeeData(
  //   input: Partial<chainAdapters.GetFeeDataInput<ChainTypes.Osmosis>>
  // ): Promise<chainAdapters.FeeDataEstimate<ChainTypes.Osmosis>> {
  //   return this.getFeeData(input)
  // }
  // broadcastTransaction(hex: string): Promise<string> {
  //   return this.broadcastTransaction(hex)
  // }
  // validateAddress(address: string): Promise<chainAdapters.ValidAddressResult> {
  //   return this.validateAddress(address)
  // }
  // subscribeTxs(
  //   input: chainAdapters.SubscribeTxsInput,
  //   onMessage: (msg: chainAdapters.SubscribeTxsMessage<ChainTypes.Osmosis>) => void,
  //   onError?: (err: chainAdapters.SubscribeError) => void
  // ): Promise<void> {
  //   return this.subscribeTxs(input, onMessage, onError)
  // }
  // unsubscribeTxs(input?: chainAdapters.SubscribeTxsInput): void {
  //   return this.unsubscribeTxs(input)
  // }
  // closeTxs(): void {
  //   return this.closeTxs()
  // }
}
