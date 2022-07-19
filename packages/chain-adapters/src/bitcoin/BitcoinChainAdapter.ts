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
  Transaction
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
  extends UTXOBaseAdapter<KnownChainIds.BitcoinMainnet>
  implements IChainAdapter<KnownChainIds.BitcoinMainnet>
{
  public static readonly defaultBIP44Params: BIP44Params = {
    purpose: 84, // segwit native
    coinType: 0,
    accountNumber: 0
  }
  public static readonly defaultUtxoAccountType: UtxoAccountType = UtxoAccountType.SegwitNative

  private static readonly supportedAccountTypes: UtxoAccountType[] = [
    UtxoAccountType.SegwitNative,
    UtxoAccountType.SegwitP2sh,
    UtxoAccountType.P2pkh
  ]

  protected readonly supportedChainIds: ChainId[] = [
    'bip122:000000000019d6689c085ae165831e93',
    'bip122:000000000933ea01ad0ee984209779ba'
  ]

  protected chainId = this.supportedChainIds[0]

  private parser: unchained.bitcoin.TransactionParser

  constructor(args: ChainAdapterArgs) {
    super(args)

    if (args.chainId && !this.supportedChainIds.includes(args.chainId)) {
      throw new Error(`Bitcoin chainId ${args.chainId} not supported`)
    }

    if (args.chainId) {
      this.chainId = args.chainId
    }

    this.coinName = args.coinName
    this.assetId = toAssetId({
      chainId: this.chainId,
      assetNamespace: 'slip44',
      assetReference: ASSET_REFERENCE.Bitcoin
    })
    this.parser = new unchained.bitcoin.TransactionParser({
      chainId: this.chainId,
      assetReference: ASSET_REFERENCE.Bitcoin
    })
  }

  getDefaultAccountType(): UtxoAccountType {
    return ChainAdapter.defaultUtxoAccountType
  }

  getDefaultBip44Params(): BIP44Params {
    return ChainAdapter.defaultBIP44Params
  }

  getTransactionParser() {
    return this.parser
  }

  getDisplayName() {
    return 'Bitcoin'
  }

  getType(): KnownChainIds.BitcoinMainnet {
    return KnownChainIds.BitcoinMainnet
  }

  getFeeAssetId(): AssetId {
    return 'bip122:000000000019d6689c085ae165831e93/slip44:0'
  }

  getSupportedAccountTypes() {
    return ChainAdapter.supportedAccountTypes
  }

  async buildSendTransaction(tx: BuildSendTxInput<KnownChainIds.BitcoinMainnet>): Promise<{
    txToSign: ChainTxType<KnownChainIds.BitcoinMainnet>
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
        throw new Error('BitcoinChainAdapter: (to and value) are required')
      }

      const path = toRootDerivationPath(bip44Params)
      const pubkey = await this.getPublicKey(wallet, bip44Params, accountType)
      const { data: utxos } = await this.providers.http.getUtxos({
        pubkey: pubkey.xpub
      })

      if (!supportsBTC(wallet))
        throw new Error(
          'BitcoinChainAdapter: signTransaction wallet does not support signing btc txs'
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
        throw new Error(`BitcoinChainAdapter: coinSelect didn't select coins`)
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
    signTxInput: SignTxInput<ChainTxType<KnownChainIds.BitcoinMainnet>>
  ): Promise<string> {
    try {
      const { txToSign, wallet } = signTxInput
      if (!supportsBTC(wallet))
        throw new Error(
          'BitcoinChainAdapter: signTransaction wallet does not support signing btc txs'
        )
      const signedTx = await wallet.btcSignTx(txToSign)
      if (!signedTx) throw ErrorHandler('BitcoinChainAdapter: error signing tx')
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
  }: GetFeeDataInput<KnownChainIds.BitcoinMainnet>): Promise<
    FeeDataEstimate<KnownChainIds.BitcoinMainnet>
  > {
    const feeData = await this.providers.http.getNetworkFees()

    if (!to || !value || !pubkey) throw new Error('to, from, value and xpub are required')
    if (
      !feeData.data.fast?.satsPerKiloByte ||
      !feeData.data.average?.satsPerKiloByte ||
      !feeData.data.slow?.satsPerKiloByte
    )
      throw new Error('undefined fee')

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
    onMessage: (msg: Transaction<KnownChainIds.BitcoinMainnet>) => void,
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
          chain: KnownChainIds.BitcoinMainnet,
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
