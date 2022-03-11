import { CAIP2, caip2, CAIP19, WellKnownAsset, WellKnownChain } from '@shapeshiftoss/caip'
import { bip32ToAddressNList, Coin, HDWallet, PublicKey } from '@shapeshiftoss/hdwallet-core'
import { BIP44Params, chainAdapters, ChainAdapterType, UtxoAccountType } from '@shapeshiftoss/types'
import * as unchained from '@shapeshiftoss/unchained-client'
import WAValidator from 'multicoin-address-validator'

import { ChainAdapter as IChainAdapter } from '../api'
import { ErrorHandler } from '../error/ErrorHandler'
import {
  accountTypeToScriptType,
  bnOrZero,
  convertXpubVersion,
  toRootDerivationPath
} from '../utils'

export type UTXOChainTypes = ChainAdapterType.Bitcoin // to be extended in the future to include other UTXOs

/**
 * Currently, we don't have a generic interact for UTXO providers, but will in the future.
 * Leaving this as-is for now, but we will need to test in the future when we have additional
 * UTXO chains implemented in unchained.
 */
export interface ChainAdapterArgs {
  providers: {
    http: unchained.bitcoin.V1Api
    ws: unchained.ws.Client<unchained.SequencedTx>
  }
  coinName: Coin // TODO(MrNerdHair): move caip-to-hdwallet-coin-name logic into hdwallet
  chainId: CAIP2
  assetId: CAIP19
}

/**
 * Base chain adapter for all UTXO chains. When extending please add your ChainAdapterType to the
 * UTXOChainTypes. For example:
 *
 * `export type UTXOChainTypes = ChainAdapterType.Bitcoin | ChainAdapterType.Litecoin`
 */
export abstract class UTXOBaseAdapter<T extends UTXOChainTypes> implements IChainAdapter<T> {
  protected readonly chainId: CAIP2
  protected readonly assetId: CAIP19
  protected readonly coinName: Coin
  protected readonly providers: {
    http: unchained.bitcoin.V1Api
    ws: unchained.ws.Client<unchained.SequencedTx>
  }

  protected constructor(supportedChainIds: CAIP2[], args: ChainAdapterArgs) {
    this.chainId = args.chainId
    if (!caip2.isCAIP2(this.chainId) || !supportedChainIds.includes(this.chainId)) {
      throw new Error(`The ChainID ${this.chainId} is not supported`)
    }
    this.coinName = args.coinName
    this.assetId = args.assetId
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

  abstract buildBIP44Params(params: Partial<BIP44Params>): BIP44Params

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

  getCaip19(): CAIP19 {
    return this.assetId
  }

  getChainId(): CAIP2 {
    return this.chainId
  }

  getAssetId(): CAIP19 {
    return this.assetId
  }

  async getAccount(pubkey: string): Promise<chainAdapters.Account<T>> {
    if (!pubkey) {
      return ErrorHandler('UTXOBaseAdapter: pubkey parameter is not defined')
    }

    try {
      const { data } = await this.providers.http.getAccount({ pubkey: pubkey })

      return {
        balance: bnOrZero(data.balance).plus(bnOrZero(data.unconfirmedBalance)).toString(),
        pubkey: data.pubkey,
        assetId: this.getAssetId(),
        chainType: this.getType(),
        chainSpecific: {
          addresses: data.addresses,
          nextChangeAddressIndex: data.nextChangeAddressIndex,
          nextReceiveAddressIndex: data.nextReceiveAddressIndex
        }
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
        curve: 'secp256k1',
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
