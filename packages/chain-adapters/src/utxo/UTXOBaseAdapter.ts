import { AssetId, ChainId } from '@shapeshiftoss/caip'
import { bip32ToAddressNList, HDWallet, PublicKey, supportsBTC } from '@shapeshiftoss/hdwallet-core'
import { BIP44Params, KnownChainIds, UtxoAccountType } from '@shapeshiftoss/types'
import * as unchained from '@shapeshiftoss/unchained-client'
import WAValidator from 'multicoin-address-validator'

import { ChainAdapter as IChainAdapter } from '../api'
import { ErrorHandler } from '../error/ErrorHandler'
import {
  Account,
  BuildSendTxInput,
  ChainTxType,
  FeeDataEstimate,
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
  getStatus,
  getType,
  toPath,
  toRootDerivationPath
} from '../utils'
import { bnOrZero } from '../utils/bignumber'
import { GetAddressInput } from './types'

export type UTXOChainIds = KnownChainIds.BitcoinMainnet | KnownChainIds.DogecoinMainnet // to be extended in the future to include other UTXOs

/**
 * Currently, we don't have a generic interact for UTXO providers, but will in the future.
 * Leaving this as-is for now, but we will need to test in the future when we have additional
 * UTXO chains implemented in unchained.
 */
export interface ChainAdapterArgs {
  providers: {
    http: unchained.bitcoin.V1Api
    ws: unchained.ws.Client<unchained.bitcoin.BitcoinTx>
  }
  coinName: string
  chainId?: ChainId
}

/**
 * Base chain adapter for all UTXO chains. When extending please add your ChainId to the
 * UTXOChainIds. For example:
 *
 * `export type UTXOChainIds = KnownChainIds.BitcoinMainnet | KnownChainIds.Litecoin`
 */
export abstract class UTXOBaseAdapter<T extends UTXOChainIds> implements IChainAdapter<T> {
  protected chainId: ChainId
  protected assetId: AssetId
  protected coinName: string
  protected accountAddresses: Record<string, Array<string>> = {}
  protected readonly supportedChainIds: ChainId[]
  protected readonly providers: {
    http: unchained.bitcoin.V1Api
    ws: unchained.ws.Client<unchained.bitcoin.BitcoinTx>
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
  abstract getDefaultBip44Params(): BIP44Params
  abstract getDefaultAccountType(): UtxoAccountType
  abstract getTransactionParser(): unchained.bitcoin.TransactionParser
  abstract getFeeAssetId(): AssetId

  abstract buildBIP44Params(params: Partial<BIP44Params>): BIP44Params

  abstract buildSendTransaction(tx: BuildSendTxInput<T>): Promise<{ txToSign: ChainTxType<T> }>

  abstract getFeeData(input: Partial<GetFeeDataInput<T>>): Promise<FeeDataEstimate<T>>

  abstract signTransaction(signTxInput: SignTxInput<ChainTxType<T>>): Promise<string>

  abstract getDisplayName(): string

  /* public methods */

  getChainId(): ChainId {
    return this.chainId
  }

  getAssetId(): AssetId {
    return this.assetId
  }

  async getAccount(pubkey: string): Promise<Account<T>> {
    if (!pubkey) {
      return ErrorHandler('UTXOBaseAdapter: pubkey parameter is not defined')
    }

    try {
      const { data } = await this.providers.http.getAccount({ pubkey })

      const balance = bnOrZero(data.balance).plus(bnOrZero(data.unconfirmedBalance))

      // cache addresses for getTxHistory to use without needing to make extra requests
      this.accountAddresses[data.pubkey] = data.addresses?.map((address) => address.pubkey) ?? [
        data.pubkey
      ]

      return {
        balance: balance.toString(),
        chain: this.getType(),
        chainId: this.chainId,
        assetId: this.assetId,
        chainSpecific: {
          addresses: data.addresses,
          nextChangeAddressIndex: data.nextChangeAddressIndex,
          nextReceiveAddressIndex: data.nextReceiveAddressIndex
        },
        pubkey: data.pubkey
      } as Account<T>
    } catch (err) {
      return ErrorHandler(err)
    }
  }

  async getAddress({
    wallet,
    bip44Params,
    accountType,
    showOnDevice = false
  }: GetAddressInput): Promise<string> {
    if (!supportsBTC(wallet)) {
      throw new Error('UTXOBaseAdapter: wallet does not support btc')
    }

    if (!bip44Params) {
      bip44Params = this.getDefaultBip44Params()
    }

    if (!accountType) {
      accountType = this.getDefaultAccountType()
    }

    let { index } = bip44Params

    // If an index is not passed in, we want to use the newest unused change/receive indices
    if (index === undefined) {
      const { xpub } = await this.getPublicKey(wallet, bip44Params, accountType)
      const account = await this.getAccount(xpub)
      index = bip44Params.isChange
        ? account.chainSpecific.nextChangeAddressIndex
        : account.chainSpecific.nextReceiveAddressIndex
    }

    const path = toPath({ ...bip44Params, index })
    const addressNList = bip32ToAddressNList(path)
    const btcAddress = await wallet.btcGetAddress({
      addressNList,
      coin: this.coinName,
      scriptType: accountTypeToScriptType[accountType],
      showDisplay: showOnDevice
    })
    if (!btcAddress) throw new Error('UTXOBaseAdapter: no address available from wallet')
    return btcAddress
  }

  async getTxHistory(input: TxHistoryInput): Promise<TxHistoryResponse<T>> {
    if (!this.accountAddresses[input.pubkey]) {
      await this.getAccount(input.pubkey)
    }

    const { data } = await this.providers.http.getTxHistory({
      pubkey: input.pubkey,
      pageSize: input.pageSize,
      cursor: input.cursor
    })

    const getAddresses = (tx: unchained.bitcoin.BitcoinTx): Array<string> => {
      const addresses: Array<string> = []

      tx.vin?.forEach((vin) => {
        if (!vin.addresses) return
        addresses.push(...vin.addresses)
      })

      tx.vout?.forEach((vout) => {
        if (!vout.addresses) return
        addresses.push(...vout.addresses)
      })

      return [...new Set(addresses)]
    }

    const txs = await Promise.all(
      (data.txs ?? []).map(async (tx) => {
        const addresses = getAddresses(tx).filter((addr) =>
          this.accountAddresses[input.pubkey].includes(addr)
        )

        return await Promise.all(
          addresses.map(async (addr) => {
            const parsedTx = await this.getTransactionParser().parse(tx, addr)

            return {
              address: addr,
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
              }))
            }
          })
        )
      })
    )

    return {
      cursor: data.cursor ?? '',
      pubkey: input.pubkey,
      transactions: txs.flat()
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

  async getPublicKey(
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
