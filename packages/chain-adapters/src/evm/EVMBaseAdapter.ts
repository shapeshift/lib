import { AssetId, ChainId, toAssetId } from '@shapeshiftoss/caip'
import { ETHSignMessage } from '@shapeshiftoss/hdwallet-core'
import { bip32ToAddressNList, ETHSignTx, ETHWallet } from '@shapeshiftoss/hdwallet-core'
import { BIP44Params, KnownChainIds } from '@shapeshiftoss/types'
import * as unchained from '@shapeshiftoss/unchained-client'
import WAValidator from 'multicoin-address-validator'

import { ChainAdapter as IChainAdapter } from '../api'
import { ErrorHandler } from '../error/ErrorHandler'
import {
  Account,
  BuildSendTxInput,
  ChainTxType,
  FeeDataEstimate,
  GetAddressInput,
  GetFeeDataInput,
  SignMessageInput,
  SignTxInput,
  SubscribeError,
  SubscribeTxsInput,
  Transaction,
  TxHistoryInput,
  TxHistoryResponse,
  ValidAddressResult,
  ValidAddressResultType
} from '../types'
import {
  chainIdToChainLabel,
  getAssetNamespace,
  getStatus,
  getType,
  toPath,
  toRootDerivationPath
} from '../utils'
import { bnOrZero } from '../utils/bignumber'

export type EVMChainIds = KnownChainIds.EthereumMainnet | KnownChainIds.AvalancheMainnet

export interface ChainAdapterArgs {
  chainId?: ChainId
  providers: {
    http: unchained.ethereum.V1Api
    ws: unchained.ws.Client<unchained.ethereum.EthereumTx>
  }
  rpcUrl: string
}

export interface EVMBaseAdapterArgs extends ChainAdapterArgs {
  supportedChainIds: Array<ChainId>
  chainId: ChainId
}

export abstract class EVMBaseAdapter<T extends EVMChainIds> implements IChainAdapter<T> {
  protected readonly chainId: ChainId
  protected readonly supportedChainIds: Array<ChainId>
  protected readonly providers: {
    http: unchained.ethereum.V1Api
    ws: unchained.ws.Client<unchained.ethereum.EthereumTx>
  }

  protected assetId: AssetId
  protected parser: unchained.ethereum.TransactionParser

  static defaultBIP44Params: BIP44Params

  constructor(args: EVMBaseAdapterArgs) {
    this.supportedChainIds = args.supportedChainIds

    if (!this.supportedChainIds.includes(args.chainId)) {
      throw new Error(`${args.chainId} not supported. (supported: ${this.supportedChainIds})`)
    }

    this.chainId = args.chainId

    EVMBaseAdapter.defaultBIP44Params = (<typeof EVMBaseAdapter>this.constructor).defaultBIP44Params

    this.providers = args.providers
  }

  abstract getType(): T
  abstract getFeeAssetId(): AssetId
  abstract getFeeData(input: Partial<GetFeeDataInput<T>>): Promise<FeeDataEstimate<T>>
  abstract buildSendTransaction(tx: BuildSendTxInput<T>): Promise<{ txToSign: ChainTxType<T> }>

  getChainId(): ChainId {
    return this.chainId
  }

  buildBIP44Params(params: Partial<BIP44Params>): BIP44Params {
    return { ...EVMBaseAdapter.defaultBIP44Params, ...params }
  }

  async getAccount(pubkey: string): Promise<Account<T>> {
    try {
      const { data } = await this.providers.http.getAccount({ pubkey })

      const balance = bnOrZero(data.balance).plus(bnOrZero(data.unconfirmedBalance))

      return {
        balance: balance.toString(),
        chainId: this.chainId,
        assetId: this.assetId,
        chain: this.getType(),
        chainSpecific: {
          nonce: data.nonce,
          tokens: data.tokens.map((token) => ({
            balance: token.balance,
            assetId: toAssetId({
              chainId: this.chainId,
              assetNamespace: getAssetNamespace(token.type),
              assetReference: token.contract
            })
          }))
        },
        pubkey: data.pubkey
      } as Account<T>
    } catch (err) {
      return ErrorHandler(err)
    }
  }

  async getTxHistory(input: TxHistoryInput): Promise<TxHistoryResponse<T>> {
    const { data } = await this.providers.http.getTxHistory({
      pubkey: input.pubkey,
      pageSize: input.pageSize,
      cursor: input.cursor
    })

    const txs = await Promise.all(
      data.txs.map(async (tx) => {
        const parsedTx = await this.parser.parse(tx, input.pubkey)

        return {
          address: input.pubkey,
          blockHash: parsedTx.blockHash,
          blockHeight: parsedTx.blockHeight,
          blockTime: parsedTx.blockTime,
          chainId: parsedTx.chainId,
          chain: this.getType(),
          confirmations: parsedTx.confirmations,
          txid: parsedTx.txid,
          fee: parsedTx.fee,
          status: getStatus(parsedTx.status),
          tradeDetails: parsedTx.trade,
          transfers: parsedTx.transfers.map((transfer) => ({
            assetId: transfer.assetId,
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
      cursor: data.cursor ?? '',
      pubkey: input.pubkey,
      transactions: txs
    }
  }

  async signTransaction(signTxInput: SignTxInput<ETHSignTx>): Promise<string> {
    try {
      const { txToSign, wallet } = signTxInput
      const signedTx = await (wallet as ETHWallet).ethSignTx(txToSign)

      if (!signedTx) throw new Error('Error signing tx')

      return signedTx.serialized
    } catch (err) {
      return ErrorHandler(err)
    }
  }

  async signAndBroadcastTransaction(signTxInput: SignTxInput<ETHSignTx>): Promise<string> {
    try {
      const { txToSign, wallet } = signTxInput
      const ethHash = await (wallet as ETHWallet)?.ethSendTx?.(txToSign)

      if (!ethHash) throw new Error('Error signing & broadcasting tx')
      return ethHash.hash
    } catch (err) {
      return ErrorHandler(err)
    }
  }

  async broadcastTransaction(hex: string) {
    const { data } = await this.providers.http.sendTx({ sendTxBody: { hex } })
    return data
  }

  async signMessage(signMessageInput: SignMessageInput<ETHSignMessage>): Promise<string> {
    try {
      const { messageToSign, wallet } = signMessageInput
      const signedMessage = await (wallet as ETHWallet).ethSignMessage(messageToSign)

      if (!signedMessage) throw new Error('EthereumChainAdapter: error signing message')

      return signedMessage.signature
    } catch (err) {
      return ErrorHandler(err)
    }
  }

  async getAddress(input: GetAddressInput): Promise<string> {
    const { wallet, bip44Params = EVMBaseAdapter.defaultBIP44Params, showOnDevice } = input
    const path = toPath(bip44Params)
    const addressNList = bip32ToAddressNList(path)
    const ethAddress = await (wallet as ETHWallet).ethGetAddress({
      addressNList,
      showDisplay: showOnDevice
    })
    return ethAddress as string
  }

  async validateAddress(address: string): Promise<ValidAddressResult> {
    const chainLabel = chainIdToChainLabel(this.chainId)
    const isValidAddress = WAValidator.validate(address, chainLabel)
    if (isValidAddress) return { valid: true, result: ValidAddressResultType.Valid }
    return { valid: false, result: ValidAddressResultType.Invalid }
  }

  async validateEnsAddress(address: string): Promise<ValidAddressResult> {
    const isValidEnsAddress = /^([0-9A-Z]([-0-9A-Z]*[0-9A-Z])?\.)+eth$/i.test(address)
    if (isValidEnsAddress) return { valid: true, result: ValidAddressResultType.Valid }
    return { valid: false, result: ValidAddressResultType.Invalid }
  }

  async subscribeTxs(
    input: SubscribeTxsInput,
    onMessage: (msg: Transaction<T>) => void,
    onError: (err: SubscribeError) => void
  ): Promise<void> {
    const { wallet, bip44Params = EVMBaseAdapter.defaultBIP44Params } = input

    const address = await this.getAddress({ wallet, bip44Params })
    const subscriptionId = toRootDerivationPath(bip44Params)

    await this.providers.ws.subscribeTxs(
      subscriptionId,
      { topic: 'txs', addresses: [address] },
      async (msg) => {
        const tx = await this.parser.parse(msg.data, msg.address)

        onMessage({
          address: tx.address,
          blockHash: tx.blockHash,
          blockHeight: tx.blockHeight,
          blockTime: tx.blockTime,
          chainId: tx.chainId,
          chain: this.getType(),
          confirmations: tx.confirmations,
          fee: tx.fee,
          status: getStatus(tx.status),
          tradeDetails: tx.trade,
          transfers: tx.transfers.map((transfer) => ({
            assetId: transfer.assetId,
            from: transfer.from,
            to: transfer.to,
            type: getType(transfer.type),
            value: transfer.totalValue
          })),
          txid: tx.txid,
          data: tx.data
        })
      },
      (err) => onError({ message: err.message })
    )
  }

  unsubscribeTxs(input?: SubscribeTxsInput): void {
    if (!input) return this.providers.ws.unsubscribeTxs()

    const { bip44Params = EVMBaseAdapter.defaultBIP44Params } = input
    const subscriptionId = toRootDerivationPath(bip44Params)

    this.providers.ws.unsubscribeTxs(subscriptionId, { topic: 'txs', addresses: [] })
  }

  closeTxs(): void {
    this.providers.ws.close('txs')
  }
}
