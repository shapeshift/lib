import { CAIP2, caip2, caip19 } from '@shapeshiftoss/caip'
import { AssetNamespace } from '@shapeshiftoss/caip/dist/caip19/caip19'
import { CosmosSignTx } from '@shapeshiftoss/hdwallet-core'
import { BIP44Params, chainAdapters, ChainTypes } from '@shapeshiftoss/types'
import { cosmos } from '@shapeshiftoss/unchained-client'
import WAValidator from 'multicoin-address-validator'

import { ChainAdapter as IChainAdapter } from '../api'
import { ChainAdapter } from '../bitcoin'
import { ErrorHandler } from '../error/ErrorHandler'

export type CosmosChainTypes = ChainTypes.Cosmos | ChainTypes.Osmosis

export interface ChainAdapterArgs {
  chainId?: CAIP2
  providers: {
    http: cosmos.api.V1Api
    // unchained-client 5.1.1 does not have a websocket client for cosmos
  }
  symbol: string
}

export abstract class CosmosSdkBaseAdapter<T extends CosmosChainTypes> implements IChainAdapter<T> {
  protected readonly chainId: CAIP2 = ''
  protected readonly supportedChainIds: CAIP2[] = []
  protected readonly symbol: string = 'ATOM'
  protected readonly providers: {
    http: cosmos.api.V1Api
  }

  public static readonly defaultBIP44Params: BIP44Params = {
    purpose: 44,
    coinType: 118,
    accountNumber: 0
  }

  constructor(args: ChainAdapterArgs) {
    if (args.chainId && this.supportedChainIds.includes(args.chainId)) {
      this.chainId = args.chainId
    }
    this.providers = args.providers
  }

  getType(): T {
    throw new Error('Method not implemented.')
  }

  getChainId(): CAIP2 {
    return this.chainId
  }

  getCaip2(): CAIP2 {
    return this.chainId
  }

  async getAccount(pubkey: string): Promise<chainAdapters.Account<T>> {
    try {
      const caip = await this.getCaip2()
      const { chain, network } = caip2.fromCAIP2(caip)
      const { data } = await this.providers.http.getAccount({ pubkey })

      return {
        balance: data.balance,
        caip2: caip,
        // This is the caip19 for default asset on the chain (ATOM/OSMO/etc)
        caip19: caip19.toCAIP19({
          chain,
          network,
          assetNamespace: AssetNamespace.Slip44,
          assetReference: '118'
        }),
        chain: this.getType(),
        chainSpecific: {
          sequence: data.sequence
        },
        pubkey: data.pubkey
      } as chainAdapters.Account<T>
    } catch (err) {
      return ErrorHandler(err)
    }
  }

  buildBIP44Params(params: Partial<BIP44Params>): BIP44Params {
    return { ...ChainAdapter.defaultBIP44Params, ...params }
  }

  async getTxHistory(
    input: chainAdapters.TxHistoryInput
  ): Promise<chainAdapters.TxHistoryResponse<T>> {
    try {
      const { data } = await this.providers.http.getTxHistory({
        pubkey: input.pubkey
      })

      throw new Error('Method not implemented.')
      // return {
      //   page: data.page,
      //   totalPages: data.totalPages,
      //   transactions: data.txs.map((tx) => ({
      //     /*
      //     missing properties from cosmos.api.Tx
      //       status: string
      //       from: string
      //       to?: string
      //       confirmations?: number
      //      */
      //     chain: caip2.fromCAIP2(this.getCaip2()).chain,
      //     network: caip2.fromCAIP2(this.getCaip2()).network,
      //     symbol: this.symbol
      //   })),
      //   txs: data.txs.length
      // }
    } catch (err) {
      return ErrorHandler(err)
    }
  }

  async buildSendTransaction(
    tx: chainAdapters.BuildSendTxInput<T>
  ): Promise<{ txToSign: chainAdapters.ChainTxType<T> }> {
    throw new Error('Method not implemented.')
  }

  async getAddress(input: chainAdapters.GetAddressInput): Promise<string> {
    // Method is implementation-specific
    throw new Error('Method not implemented.')
  }

  async getFeeData(
    input: Partial<chainAdapters.GetFeeDataInput<T>>
  ): Promise<chainAdapters.FeeDataEstimate<T>> {
    throw new Error('Method not implemented.')
  }

  async signTransaction(
    signTxInput: chainAdapters.SignTxInput<chainAdapters.ChainTxType<T>>
  ): Promise<string> {
    // Method is implementation-specific
    throw new Error('Method not implemented.')
  }

  async broadcastTransaction(hex: string): Promise<string> {
    const { data } = await this.providers.http.sendTx({
      body: { hex }
    })
    return data
  }

  async signAndBroadcastTransaction(
    signTxInput: chainAdapters.SignTxInput<CosmosSignTx>
  ): Promise<string> {
    throw new Error('Method not implemented.')
  }

  async validateAddress(address: string): Promise<chainAdapters.ValidAddressResult> {
    const isValidAddress = WAValidator.validate(address, this.getType())
    if (isValidAddress) return { valid: true, result: chainAdapters.ValidAddressResultType.Valid }
    return { valid: false, result: chainAdapters.ValidAddressResultType.Invalid }
  }

  async subscribeTxs(
    input: chainAdapters.SubscribeTxsInput,
    onMessage: (msg: chainAdapters.SubscribeTxsMessage<T>) => void,
    onError?: (err: chainAdapters.SubscribeError) => void
  ): Promise<void> {
    throw new Error('Method not implemented.')
    // const { wallet, bip44Params = ChainAdapter.defaultBIP44Params } = input
    //
    // const address = await this.getAddress({ wallet, bip44Params })
    // const subscriptionId = toRootDerivationPath(bip44Params)
    //
    // await this.providers.ws.subscribeTxs(
    //   subscriptionId,
    //   { topic: 'txs', addresses: [address] },
    //   (msg: chainAdapters.SubscribeTxsMessage<T>) => {
    //     const transfers = msg.transfers.map<chainAdapters.TxTransfer>((transfer) => ({
    //       caip19: transfer.caip19,
    //       from: transfer.from,
    //       to: transfer.to,
    //       type: transfer.type,
    //       value: transfer.value
    //     }))
    //
    //     onMessage({
    //       address: msg.address,
    //       blockHash: msg.blockHash,
    //       blockHeight: msg.blockHeight,
    //       blockTime: msg.blockTime,
    //       caip2: msg.caip2,
    //       chain: this.getType(),
    //       confirmations: msg.confirmations,
    //       fee: msg.fee,
    //       status: msg.status,
    //       tradeDetails: msg.tradeDetails,
    //       transfers,
    //       txid: msg.txid
    //     })
    //   },
    //   (err: chainAdapters.SubscribeError) => onError?.({ message: err.message })
    // )
  }

  unsubscribeTxs(input?: chainAdapters.SubscribeTxsInput): void {
    throw new Error('Method not implemented.')
    // if (!input) return this.providers.ws.unsubscribeTxs()
    //
    // const { bip44Params = ChainAdapter.defaultBIP44Params } = input
    // const subscriptionId = toRootDerivationPath(bip44Params)
    //
    // this.providers.ws.unsubscribeTxs(subscriptionId, {
    //   topic: 'txs',
    //   addresses: []
    // })
  }

  closeTxs(): void {
    throw new Error('Method not implemented.')
  }
}
