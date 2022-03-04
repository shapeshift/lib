/* eslint-disable @typescript-eslint/no-unused-vars */
// no-unused-vars is temporarily disabled until more functions are implemented
import { AssetNamespace, CAIP2, caip2, caip19 } from '@shapeshiftoss/caip'
import { CosmosSignTx } from '@shapeshiftoss/hdwallet-core'
import { BIP44Params, chainAdapters, ChainTypes } from '@shapeshiftoss/types'
import { cosmos } from '@shapeshiftoss/unchained-client'
import { cosmos as cosmosTxParser } from '@shapeshiftoss/unchained-tx-parser'
import WAValidator from 'multicoin-address-validator'

import { ChainAdapter as IChainAdapter } from '../api'
import { ChainAdapter } from '../bitcoin'
import { ErrorHandler } from '../error/ErrorHandler'
import { getStatus, getType } from '../utils'

export type CosmosChainTypes = ChainTypes.Cosmos | ChainTypes.Osmosis

export interface ChainAdapterArgs {
  chainId?: CAIP2
  providers: {
    http: cosmos.api.V1Api
    // unchained-client 5.1.1 does not have a websocket client for cosmos
  }
  coinName: string
}

export abstract class CosmosSdkBaseAdapter<T extends CosmosChainTypes> implements IChainAdapter<T> {
  protected readonly chainId: CAIP2
  protected readonly supportedChainIds: CAIP2[]
  protected readonly coinName: string
  protected readonly providers: {
    http: cosmos.api.V1Api
  }
  protected txParser: cosmosTxParser.TransactionParser

  public static readonly defaultBIP44Params: BIP44Params = {
    purpose: 44,
    coinType: 118,
    accountNumber: 0
  }

  protected constructor(args: ChainAdapterArgs) {
    if (args.chainId && this.supportedChainIds.includes(args.chainId)) {
      this.chainId = args.chainId
    }
    this.providers = args.providers
  }

  abstract getType(): T

  getChainId(): CAIP2 {
    return this.chainId
  }

  getCaip2(): CAIP2 {
    return this.chainId
  }

  async getAccount(pubkey: string): Promise<chainAdapters.Account<T>> {
    try {
      const caip = this.getCaip2()
      const { chain, network } = caip2.fromCAIP2(caip)
      const { data } = await this.providers.http.getAccount({ pubkey })

      return {
        balance: data.balance,
        caip2: caip,
        // This is the caip19 for native token on the chain (ATOM/OSMO/etc)
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
        /* TypeScript can't guarantee the correct type for the chainSpecific field because of the generic return type.
           It is preferable to define and type the return instead of applying the cast below, but that's left as an exercise
           for the reader. */
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
        pubkey: input.pubkey,
        pageSize: input.pageSize,
        cursor: input.cursor
      })

      const txs = await Promise.all(
        data.txs.map(async (tx) => {
          const parsedTx = await this.txParser.parse(tx, input.pubkey)

          return {
            address: input.pubkey,
            blockHash: parsedTx.blockHash,
            blockHeight: parsedTx.blockHeight,
            blockTime: parsedTx.blockTime,
            caip2: this.getCaip2(),
            chain: this.getType(),
            confirmations: parsedTx.confirmations,
            txid: tx.txid,
            fee: parsedTx.fee,
            status: getStatus(parsedTx.status),
            tradeDetails: parsedTx.trade,
            transfers: parsedTx.transfers.map<chainAdapters.TxTransfer>((transfer) => ({
              caip19: transfer.caip19,
              from: transfer.from,
              to: transfer.to,
              type: getType(transfer.type),
              value: transfer.totalValue
            })),
            data: parsedTx.data
          }
        })
      )

      return {
        cursor: data.cursor,
        transactions: txs
      }
    } catch (err) {
      return ErrorHandler(err)
    }
  }

  abstract buildSendTransaction(
    tx: chainAdapters.BuildSendTxInput<T>
  ): Promise<{ txToSign: chainAdapters.ChainTxType<T> }>

  abstract getAddress(input: chainAdapters.GetAddressInput): Promise<string>

  abstract getFeeData(
    input: Partial<chainAdapters.GetFeeDataInput<T>>
  ): Promise<chainAdapters.FeeDataEstimate<T>>

  abstract signTransaction(
    signTxInput: chainAdapters.SignTxInput<chainAdapters.ChainTxType<T>>
  ): Promise<string>

  async broadcastTransaction(hex: string): Promise<string> {
    const { data } = await this.providers.http.sendTx({
      body: { rawTx: hex }
    })
    return data
  }

  abstract signAndBroadcastTransaction(
    signTxInput: chainAdapters.SignTxInput<CosmosSignTx>
  ): Promise<string>

  async validateAddress(address: string): Promise<chainAdapters.ValidAddressResult> {
    const isValidAddress = WAValidator.validate(address, this.getType())
    if (isValidAddress) return { valid: true, result: chainAdapters.ValidAddressResultType.Valid }
    return { valid: false, result: chainAdapters.ValidAddressResultType.Invalid }
  }

  async subscribeTxs(
    input: chainAdapters.SubscribeTxsInput,
    onMessage: (msg: chainAdapters.Transaction<T>) => void,
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
    //   (msg: chainAdapters.Transaction<T>) => {
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
