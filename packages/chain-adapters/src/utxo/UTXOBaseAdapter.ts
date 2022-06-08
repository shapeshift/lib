import { AssetId, ChainId } from '@shapeshiftoss/caip'
import { bip32ToAddressNList, HDWallet, PublicKey } from '@shapeshiftoss/hdwallet-core'
import { BIP44Params, KnownChainIds, UtxoAccountType } from '@shapeshiftoss/types'
import * as unchained from '@shapeshiftoss/unchained-client'
import { BitcoinAddress } from '@shapeshiftoss/unchained-client/src/generated/bitcoin'
import WAValidator from 'multicoin-address-validator'

import { ChainAdapter as IChainAdapter } from '../api'
import { ErrorHandler } from '../error/ErrorHandler'
import {
  Account,
  BuildSendTxInput,
  ChainTxType,
  FeeData,
  FeeDataEstimate,
  GetAddressInput,
  GetFeeDataInput,
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
  accountTypeToScriptType,
  chainIdToChainLabel,
  convertXpubVersion,
  toRootDerivationPath
} from '../utils'
import { bnOrZero } from '../utils/bignumber'

export type UTXOChainTypes = KnownChainIds.BitcoinMainnet // to be extended in the future to include other UTXOs

/**
 * Currently, we don't have a generic interact for UTXO providers, but will in the future.
 * Leaving this as-is for now, but we will need to test in the future when we have additional
 * UTXO chains implemented in unchained.
 */
export interface ChainAdapterArgs {
  providers: {
    http: unchained.bitcoin.V1Api
    ws: unchained.ws.Client<unchained.Tx>
  }
  coinName: string
  chainId?: ChainId
}

type BitcoinFeeData = FeeData & { cost: string }
/**
 * Base chain adapter for all UTXO chains. When extending please add your ChainType to the
 * UTXOChainTypes. For example:
 *
 * `export type UTXOChainTypes = ChainTypes.Bitcoin | ChainTypes.Litecoin`
 */
export abstract class UTXOBaseAdapter<T extends UTXOChainTypes> implements IChainAdapter {
  protected chainId: ChainId
  protected assetId: AssetId
  protected coinName: string
  protected readonly supportedChainIds: ChainId[]
  protected readonly providers: {
    http: unchained.bitcoin.V1Api
    ws: unchained.ws.Client<unchained.Tx>
  }

  protected constructor(args: ChainAdapterArgs) {
    this.providers = args.providers
  }

  /* Abstract Methods */

  abstract subscribeTxs(
    input: SubscribeTxsInput,
    onMessage: (msg: Transaction<T>) => void,
    onError?: (err: SubscribeError) => void
  ): Promise<void>
  abstract unsubscribeTxs(input?: SubscribeTxsInput): void
  abstract closeTxs(): void
  abstract getType(): T
  abstract getSupportedAccountTypes(): UtxoAccountType[]
  abstract getFeeAssetId(): AssetId
  abstract getTxHistory(input: TxHistoryInput): Promise<TxHistoryResponse<T>>

  abstract buildBIP44Params(params: Partial<BIP44Params>): BIP44Params

  abstract buildSendTransaction(tx: BuildSendTxInput<T>): Promise<{ txToSign: ChainTxType<T> }>

  abstract getAddress(input: GetAddressInput): Promise<string>

  abstract getFeeData(input: Partial<GetFeeDataInput<T>>): Promise<FeeDataEstimate<BitcoinFeeData>>

  abstract signTransaction(signTxInput: SignTxInput<ChainTxType<T>>): Promise<string>

  /* public methods */

  getChainId(): ChainId {
    return this.chainId
  }

  getAssetId(): AssetId {
    return this.assetId
  }

  async getAccount(pubkey: string): Promise<
    Account & {
      chainSpecific: {
        addresses?: BitcoinAddress[]
        nextChangeAddressIndex?: number
        nextReceiveAddressIndex?: number
      }
    }
  > {
    if (!pubkey) {
      return ErrorHandler('UTXOBaseAdapter: pubkey parameter is not defined')
    }

    try {
      const { data } = await this.providers.http.getAccount({ pubkey })

      const balance = bnOrZero(data.balance).plus(bnOrZero(data.unconfirmedBalance))

      return {
        balance: balance.toString(),
        chainId: this.chainId,
        assetId: this.assetId,
        chainSpecific: {
          addresses: data.addresses,
          nextChangeAddressIndex: data.nextChangeAddressIndex,
          nextReceiveAddressIndex: data.nextReceiveAddressIndex
        },
        pubkey: data.pubkey
      }
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

  async validateAddress(address: string): Promise<ValidAddressResult> {
    const chainLabel = chainIdToChainLabel(this.chainId)
    const isValidAddress = WAValidator.validate(address, chainLabel)
    if (isValidAddress) return { valid: true, result: ValidAddressResultType.Valid }
    return { valid: false, result: ValidAddressResultType.Invalid }
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
