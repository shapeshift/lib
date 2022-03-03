import { AssetNamespace, AssetReference, CAIP2, caip2, caip19 } from '@shapeshiftoss/caip'
import { bip32ToAddressNList, HDWallet, PublicKey } from '@shapeshiftoss/hdwallet-core'
import { BIP44Params, chainAdapters, ChainTypes, UtxoAccountType } from '@shapeshiftoss/types'
import { bitcoin } from '@shapeshiftoss/unchained-client'
import WAValidator from 'multicoin-address-validator'

import { ChainAdapter as IChainAdapter } from '../api'
import { ErrorHandler } from '../error/ErrorHandler'
import {
  accountTypeToScriptType,
  bnOrZero,
  convertXpubVersion,
  toRootDerivationPath
} from '../utils'

export type UTXOChainTypes = ChainTypes.Bitcoin // to be extended in the future to include other UTXOs

export interface ChainAdapterArgs {
  providers: {
    http: bitcoin.api.V1Api //?
    ws: bitcoin.ws.Client
  }
  coinName: string
  chainId?: CAIP2
}

/**
 * Base chain adapter for all UTXO chains. When extending please add your ChainType to the
 * UTXOChainTypes. For example:
 *
 * `export type UTXOChainTypes = ChainTypes.Bitcoin | ChainTypes.Litecoin`
 */
export abstract class UTXOBaseAdapter<T extends UTXOChainTypes> implements IChainAdapter<T> {
  protected chainId: CAIP2
  protected coinName: string
  protected readonly providers: {
    http: bitcoin.api.V1Api
    ws: bitcoin.ws.Client
  }

  public static readonly defaultBIP44Params: BIP44Params = {
    purpose: 84, // segwit native
    coinType: 0,
    accountNumber: 0
  }

  protected constructor(args: ChainAdapterArgs) {
    this.providers = args.providers
  }

  /* Abstract Methods */

  abstract subscribeTxs(
    input: chainAdapters.SubscribeTxsInput,
    onMessage: (msg: chainAdapters.SubscribeTxsMessage<T>) => void,
    onError?: (err: chainAdapters.SubscribeError) => void
  ): Promise<void>
  abstract unsubscribeTxs(input?: chainAdapters.SubscribeTxsInput): void
  abstract closeTxs(): void
  abstract getType(): T

  abstract getTxHistory(
    input: chainAdapters.TxHistoryInput
  ): Promise<chainAdapters.TxHistoryResponse<T>>

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

  /* public methods */

  getCaip2(): CAIP2 {
    return this.chainId
  }

  getChainId(): CAIP2 {
    return this.chainId
  }

  async getAccount(pubkey: string): Promise<chainAdapters.Account<T>> {
    if (!pubkey) {
      return ErrorHandler('UTXOBaseAdapter: pubkey parameter is not defined')
    }

    try {
      const caip = await this.getCaip2()
      const { chain, network } = caip2.fromCAIP2(caip)
      const { data } = await this.providers.http.getAccount({ pubkey: pubkey })

      const balance = bnOrZero(data.balance).plus(bnOrZero(data.unconfirmedBalance))

      return {
        balance: balance.toString(),
        chain: this.getType(),
        caip2: caip,
        caip19: caip19.toCAIP19({
          chain,
          network,
          assetNamespace: AssetNamespace.Slip44,
          assetReference: AssetReference.Bitcoin
        }),
        chainSpecific: {
          addresses: data.addresses,
          nextChangeAddressIndex: data.nextChangeAddressIndex,
          nextReceiveAddressIndex: data.nextReceiveAddressIndex
        },
        pubkey: data.pubkey
      } as chainAdapters.Account<T>
    } catch (err) {
      return ErrorHandler(err)
    }
  }

  async broadcastTransaction(hex: string): Promise<string> {
    const { data } = await this.providers.http.sendTx({
      sendTxBody: { hex }
    })
    return data
  }

  async validateAddress(address: string): Promise<chainAdapters.ValidAddressResult> {
    const isValidAddress = WAValidator.validate(address, this.getType())
    if (isValidAddress) return { valid: true, result: chainAdapters.ValidAddressResultType.Valid }
    return { valid: false, result: chainAdapters.ValidAddressResultType.Invalid }
  }

  buildBIP44Params(params: Partial<BIP44Params>): BIP44Params {
    return { ...UTXOBaseAdapter.defaultBIP44Params, ...params }
  }

  /* protected / private methods */
  protected async getPublicKey(
    wallet: HDWallet,
    bip44Params: BIP44Params,
    accountType: UtxoAccountType
  ): Promise<PublicKey> {
    const path = toRootDerivationPath(bip44Params)
    const publicKeys = await wallet.getPublicKeys([
      {
        coin: this.coinName,
        addressNList: bip32ToAddressNList(path),
        curve: 'secp256k1', // TODO(0xdef1cafe): from constant?
        scriptType: accountTypeToScriptType[accountType]
      }
    ])
    if (!publicKeys?.[0]) throw new Error("couldn't get public key")

    if (accountType) {
      return { xpub: convertXpubVersion(publicKeys[0].xpub, accountType) }
    }

    return publicKeys[0]
  }
}
