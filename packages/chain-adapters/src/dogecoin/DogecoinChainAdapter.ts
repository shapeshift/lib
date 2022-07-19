import { ASSET_REFERENCE, AssetId, ChainId, toAssetId } from '@shapeshiftoss/caip'
import {
  bip32ToAddressNList,
  BTCOutputAddressType,
  BTCSignTx,
  BTCSignTxInput,
  BTCSignTxOutput,
  supportsBTC
} from '@shapeshiftoss/hdwallet-core'
import { BIP44Params, KnownChainIds, UtxoAccountType } from '@shapeshiftoss/types'
import * as unchained from '@shapeshiftoss/unchained-client'

import { ChainAdapter as IChainAdapter } from '../api'
import { ErrorHandler } from '../error/ErrorHandler'
import {
  BuildSendTxInput,
  ChainTxType,
  FeeDataEstimate,
  FeeDataKey,
  GetFeeDataInput,
  SignTxInput,
  SubscribeError,
  SubscribeTxsInput,
  Transaction,
  TxHistoryInput,
  TxHistoryResponse
} from '../types'
import {
  accountTypeToOutputScriptType,
  accountTypeToScriptType,
  getStatus,
  getType,
  toRootDerivationPath
} from '../utils'
import { ChainAdapterArgs, UTXOBaseAdapter } from '../utxo/UTXOBaseAdapter'
import { utxoSelect } from '../utxo/utxoSelect'

export class ChainAdapter
  extends UTXOBaseAdapter<KnownChainIds.DogecoinMainnet>
  implements IChainAdapter<KnownChainIds.DogecoinMainnet>
{
  public static readonly defaultBIP44Params: BIP44Params = {
    purpose: 44,
    coinType: 3,
    accountNumber: 0
  }
  public static readonly defaultUtxoAccountType: UtxoAccountType = UtxoAccountType.P2pkh

  private static readonly supportedAccountTypes: UtxoAccountType[] = [UtxoAccountType.P2pkh]

  protected readonly supportedChainIds: ChainId[] = ['bip122:00000000001a91e3dace36e2be3bf030']

  protected chainId = this.supportedChainIds[0]

  private parser: unchained.bitcoin.TransactionParser

  constructor(args: ChainAdapterArgs) {
    super(args)

    if (args.chainId && !this.supportedChainIds.includes(args.chainId)) {
      throw new Error(`Dogecoin chainId ${args.chainId} not supported`)
    }

    if (args.chainId) {
      this.chainId = args.chainId
    }

    this.coinName = args.coinName
    this.assetId = toAssetId({
      chainId: this.chainId,
      assetNamespace: 'slip44',
      assetReference: ASSET_REFERENCE.Dogecoin
    })

    this.parser = new unchained.bitcoin.TransactionParser({
      chainId: this.chainId,
      assetReference: ASSET_REFERENCE.Dogecoin
    })
  }

  getDefaultAccountType(): UtxoAccountType {
    return ChainAdapter.defaultUtxoAccountType
  }

  getDefaultBip44Params(): BIP44Params {
    return ChainAdapter.defaultBIP44Params
  }

  getDisplayName() {
    return 'Dogecoin'
  }

  getType(): KnownChainIds.DogecoinMainnet {
    return KnownChainIds.DogecoinMainnet
  }

  getFeeAssetId(): AssetId {
    return 'bip122:00000000001a91e3dace36e2be3bf030/slip44:3'
  }

  getSupportedAccountTypes() {
    return ChainAdapter.supportedAccountTypes
  }

  async getTxHistory(
    input: TxHistoryInput
  ): Promise<TxHistoryResponse<KnownChainIds.DogecoinMainnet>> {
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
            const parsedTx = await this.parser.parse(tx, addr)

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

  async buildSendTransaction(tx: BuildSendTxInput<KnownChainIds.DogecoinMainnet>): Promise<{
    txToSign: ChainTxType<KnownChainIds.DogecoinMainnet>
  }> {
    try {
      const {
        value,
        to,
        wallet,
        bip44Params = ChainAdapter.defaultBIP44Params,
        chainSpecific: { satoshiPerByte, accountType, opReturnData },
        sendMax = false
      } = tx

      if (!value || !to) {
        throw new Error('DogecoinChainAdapter: (to and value) are required')
      }

      const path = toRootDerivationPath(bip44Params)
      const pubkey = await this.getPublicKey(wallet, bip44Params, accountType)
      const { data: utxos } = await this.providers.http.getUtxos({
        pubkey: pubkey.xpub
      })

      if (!supportsBTC(wallet))
        throw new Error(
          'DogecoinChainAdapter: signTransaction wallet does not support signing btc txs'
        )

      const account = await this.getAccount(pubkey.xpub)

      const coinSelectResult = utxoSelect({
        utxos,
        to,
        satoshiPerByte,
        sendMax,
        value,
        opReturnData
      })

      if (!coinSelectResult || !coinSelectResult.inputs || !coinSelectResult.outputs) {
        throw new Error(`DogecoinChainAdapter: coinSelect didn't select coins`)
      }

      const { inputs, outputs } = coinSelectResult

      const signTxInputs: BTCSignTxInput[] = []
      for (const input of inputs) {
        if (!input.path) continue
        const getTransactionResponse = await this.providers.http.getTransaction({
          txid: input.txid
        })
        const inputTx = getTransactionResponse.data

        signTxInputs.push({
          addressNList: bip32ToAddressNList(input.path),
          // https://github.com/shapeshift/hdwallet/issues/362
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          scriptType: accountTypeToScriptType[accountType] as any,
          amount: String(input.value),
          vout: input.vout,
          txid: input.txid,
          hex: inputTx.hex
        })
      }

      const signTxOutputs: BTCSignTxOutput[] = outputs.map((out) => {
        const amount = String(out.value)
        if (!out.address) {
          return {
            addressType: BTCOutputAddressType.Change,
            amount,
            addressNList: bip32ToAddressNList(
              `${path}/1/${String(account.chainSpecific.nextChangeAddressIndex)}`
            ),
            scriptType: accountTypeToOutputScriptType[accountType],
            isChange: true
          }
        } else {
          return {
            addressType: BTCOutputAddressType.Spend,
            amount,
            address: out.address
          }
        }
      })

      const txToSign: BTCSignTx = {
        coin: this.coinName,
        inputs: signTxInputs,
        outputs: signTxOutputs,
        opReturnData
      }
      return { txToSign }
    } catch (err) {
      return ErrorHandler(err)
    }
  }

  buildBIP44Params(params: Partial<BIP44Params>): BIP44Params {
    return { ...ChainAdapter.defaultBIP44Params, ...params }
  }

  async signTransaction(
    signTxInput: SignTxInput<ChainTxType<KnownChainIds.DogecoinMainnet>>
  ): Promise<string> {
    try {
      const { txToSign, wallet } = signTxInput
      if (!supportsBTC(wallet))
        throw new Error(
          'DogecoinChainAdapter: signTransaction wallet does not support signing btc txs'
        )
      const signedTx = await wallet.btcSignTx(txToSign)
      if (!signedTx) throw ErrorHandler('DogecoinChainAdapter: error signing tx')
      return signedTx.serializedTx
    } catch (err) {
      return ErrorHandler(err)
    }
  }

  async getFeeData({
    to,
    value,
    chainSpecific: { pubkey, opReturnData },
    sendMax = false
  }: GetFeeDataInput<KnownChainIds.DogecoinMainnet>): Promise<
    FeeDataEstimate<KnownChainIds.DogecoinMainnet>
  > {
    const feeData = await this.providers.http.getNetworkFees()

    if (!to || !value || !pubkey) throw new Error('to, from, value and xpub are required')
    if (!feeData.data.average?.satsPerKiloByte || !feeData.data.slow?.satsPerKiloByte) {
      throw new Error('undefined fee')
    }

    // fast returning -100000000?
    if (!feeData.data.fast?.satsPerKiloByte || feeData.data.fast?.satsPerKiloByte < 0) {
      feeData.data.fast = feeData.data.average
    }
    // We have to round because coinselect library uses sats per byte which cant be decimals
    const fastPerByte = String(Math.round(feeData.data.fast.satsPerKiloByte / 1024))
    const averagePerByte = String(Math.round(feeData.data.average.satsPerKiloByte / 1024))
    const slowPerByte = String(Math.round(feeData.data.slow.satsPerKiloByte / 1024))

    const { data: utxos } = await this.providers.http.getUtxos({
      pubkey
    })

    const utxoSelectInput = {
      to,
      value,
      opReturnData,
      utxos,
      sendMax
    }

    const { fee: fastFee } = utxoSelect({
      ...utxoSelectInput,
      satoshiPerByte: fastPerByte
    })
    const { fee: averageFee } = utxoSelect({
      ...utxoSelectInput,
      satoshiPerByte: averagePerByte
    })
    const { fee: slowFee } = utxoSelect({
      ...utxoSelectInput,
      satoshiPerByte: slowPerByte
    })

    return {
      [FeeDataKey.Fast]: {
        txFee: String(fastFee),
        chainSpecific: {
          satoshiPerByte: fastPerByte
        }
      },
      [FeeDataKey.Average]: {
        txFee: String(averageFee),
        chainSpecific: {
          satoshiPerByte: averagePerByte
        }
      },
      [FeeDataKey.Slow]: {
        txFee: String(slowFee),
        chainSpecific: {
          satoshiPerByte: slowPerByte
        }
      }
    }
  }

  async subscribeTxs(
    input: SubscribeTxsInput,
    onMessage: (msg: Transaction<KnownChainIds.DogecoinMainnet>) => void,
    onError: (err: SubscribeError) => void
  ): Promise<void> {
    const {
      wallet,
      bip44Params = ChainAdapter.defaultBIP44Params,
      accountType = ChainAdapter.defaultUtxoAccountType
    } = input

    const { xpub } = await this.getPublicKey(wallet, bip44Params, accountType)
    const account = await this.getAccount(xpub)
    const addresses = (account.chainSpecific.addresses ?? []).map((address) => address.pubkey)
    const subscriptionId = `${toRootDerivationPath(bip44Params)}/${accountType}`

    await this.providers.ws.subscribeTxs(
      subscriptionId,
      { topic: 'txs', addresses },
      async (msg) => {
        const tx = await this.parser.parse(msg.data, msg.address)

        onMessage({
          address: tx.address,
          blockHash: tx.blockHash,
          blockHeight: tx.blockHeight,
          blockTime: tx.blockTime,
          chainId: tx.chainId,
          chain: KnownChainIds.DogecoinMainnet,
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
          txid: tx.txid
        })
      },
      (err) => onError({ message: err.message })
    )
  }

  unsubscribeTxs(input?: SubscribeTxsInput): void {
    if (!input) return this.providers.ws.unsubscribeTxs()

    const {
      bip44Params = ChainAdapter.defaultBIP44Params,
      accountType = ChainAdapter.defaultUtxoAccountType
    } = input
    const subscriptionId = `${toRootDerivationPath(bip44Params)}/${accountType}`

    this.providers.ws.unsubscribeTxs(subscriptionId, { topic: 'txs', addresses: [] })
  }

  closeTxs(): void {
    this.providers.ws.close('txs')
  }
}
