/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { CAIP2, caip2, caip19 } from '@shapeshiftoss/caip'
import { bip32ToAddressNList, Cosmos, CosmosSignTx, CosmosTx } from '@shapeshiftoss/hdwallet-core'
import { BIP44Params, chainAdapters, ChainTypes, NetworkTypes } from '@shapeshiftoss/types'
import { ChainAdapter as IChainAdapter } from '../api'
import { ChainAdapter } from '../bitcoin'
import { ErrorHandler } from '../error/ErrorHandler'
import { toPath, toRootDerivationPath } from '../utils'
import WAValidator from 'multicoin-address-validator'
import { FeeDataKey } from '@shapeshiftoss/types/dist/chain-adapters'
import BigNumber from 'bignumber.js'
import { ChainReference } from '../../../caip/dist/caip2/caip2'

export type CosmosChainTypes = ChainTypes.Cosmos | ChainTypes.Osmosis

export interface ChainAdapterArgs {
  providers: {
    http: any
    ws: any
  }
  symbol: string
  network: NetworkTypes
}

export abstract class CosmosSdkBaseAdapter<T extends CosmosChainTypes> implements IChainAdapter<T> {
  public static readonly defaultBIP44Params: BIP44Params = {
    purpose: 44,
    coinType: 118,
    accountNumber: 0
  }

  chainSpecificProperties: ChainAdapterArgs

  setChainSpecificProperties(args: ChainAdapterArgs) {
    this.chainSpecificProperties = args
  }

  getType(): T {
    throw new Error('Method not implemented.')
  }

  async getCaip2(): Promise<CAIP2> {
    try {
      const { data } = await this.chainSpecificProperties.providers.http.getInfo()

      switch (data.network) {
        case 'mainnet':
          return caip2.toCAIP2({
            chain: this.getType(),
            network: this.chainSpecificProperties.network
          })
        default:
          throw new Error(`CosmosChainAdapter: network is not supported: ${data.network}`)
      }
    } catch (err) {
      return ErrorHandler(err)
    }
  }

  async getAccount(pubkey: string): Promise<chainAdapters.Account<T>> {
    try {
      const caip = await this.getCaip2()
      const { chain, network } = caip2.fromCAIP2(caip)
      const { data } = await this.chainSpecificProperties.providers.http.getAccount({ pubkey })

      return {
        balance: data.balance,
        caip2: caip,
        caip19: caip19.toCAIP19({ chain, network }),
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
      const { data } = await this.chainSpecificProperties.providers.http.getTxHistory({
        pubkey: input.pubkey
      })

      return {
        page: data.page,
        totalPages: data.totalPages,
        transactions: data.transactions.map((tx: chainAdapters.Transaction<T>) => ({
          ...tx,
          chain: this.getType(),
          network: this.chainSpecificProperties.network,
          symbol: this.chainSpecificProperties.symbol
        })),
        txs: data.txs
      }
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

  async signTransaction(
    signTxInput: chainAdapters.SignTxInput<chainAdapters.ChainTxType<T>>
  ): Promise<string> {
    // Method is implementation-specific
    throw new Error('Method not implemented.')
  }

  async getFeeData(
    input: Partial<chainAdapters.GetFeeDataInput<T>>
  ): Promise<chainAdapters.FeeDataEstimate<T>> {
    throw new Error('Method not implemented.')
  }

  async broadcastTransaction(hex: string): Promise<string> {
    const { data } = await this.chainSpecificProperties.providers.http.sendTx({
      sendTxBody: { hex }
    })
    return data
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
    const { wallet, bip44Params = ChainAdapter.defaultBIP44Params } = input

    const address = await this.getAddress({ wallet, bip44Params })
    const subscriptionId = toRootDerivationPath(bip44Params)

    await this.chainSpecificProperties.providers.ws.subscribeTxs(
      subscriptionId,
      { topic: 'txs', addresses: [address] },
      (msg: chainAdapters.SubscribeTxsMessage<T>) => {
        const transfers = msg.transfers.map<chainAdapters.TxTransfer>((transfer) => ({
          caip19: transfer.caip19,
          from: transfer.from,
          to: transfer.to,
          type: transfer.type,
          value: transfer.value
        }))

        onMessage({
          address: msg.address,
          blockHash: msg.blockHash,
          blockHeight: msg.blockHeight,
          blockTime: msg.blockTime,
          caip2: msg.caip2,
          chain: this.getType(),
          confirmations: msg.confirmations,
          fee: msg.fee,
          status: msg.status,
          tradeDetails: msg.tradeDetails,
          transfers,
          txid: msg.txid
        })
      },
      (err: chainAdapters.SubscribeError) => onError?.({ message: err.message })
    )
  }

  unsubscribeTxs(input?: chainAdapters.SubscribeTxsInput): void {
    if (!input) return this.chainSpecificProperties.providers.ws.unsubscribeTxs()

    const { bip44Params = ChainAdapter.defaultBIP44Params } = input
    const subscriptionId = toRootDerivationPath(bip44Params)

    this.chainSpecificProperties.providers.ws.unsubscribeTxs(subscriptionId, {
      topic: 'txs',
      addresses: []
    })
  }

  closeTxs(): void {
    this.chainSpecificProperties.providers.ws.close('txs')
  }
}