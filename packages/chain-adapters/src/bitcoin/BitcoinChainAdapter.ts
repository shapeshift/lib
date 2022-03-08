import { AssetNamespace, AssetReference, CAIP2, caip2, caip19 } from '@shapeshiftoss/caip'
import {
  bip32ToAddressNList,
  BTCOutputAddressType,
  BTCSignTx,
  BTCSignTxInput,
  BTCSignTxOutput,
  HDWallet,
  PublicKey,
  supportsBTC
} from '@shapeshiftoss/hdwallet-core'
import { BIP44Params, chainAdapters, ChainTypes, UtxoAccountType } from '@shapeshiftoss/types'
import * as unchained from '@shapeshiftoss/unchained-client'
import coinSelect from 'coinselect'
import split from 'coinselect/split'
import WAValidator from 'multicoin-address-validator'

import { ChainAdapter as IChainAdapter } from '../api'
import { ErrorHandler } from '../error/ErrorHandler'
import {
  accountTypeToOutputScriptType,
  accountTypeToScriptType,
  bnOrZero,
  convertXpubVersion,
  getStatus,
  getType,
  toPath,
  toRootDerivationPath
} from '../utils'

export interface ChainAdapterArgs {
  providers: {
    http: unchained.bitcoin.V1Api
    ws: unchained.ws.Client<unchained.SequencedTx>
  }
  coinName: string
  chainId?: CAIP2
}

export class ChainAdapter implements IChainAdapter<ChainTypes.Bitcoin> {
  private readonly providers: {
    http: unchained.bitcoin.V1Api
    ws: unchained.ws.Client<unchained.SequencedTx>
  }

  public static readonly defaultBIP44Params: BIP44Params = {
    purpose: 84, // segwit native
    coinType: 0,
    accountNumber: 0
  }

  private readonly chainId: CAIP2 = 'bip122:000000000019d6689c085ae165831e93'

  // TODO(0xdef1cafe): constraint this to utxo coins and refactor this to be a UTXOChainAdapter
  coinName: string

  constructor(args: ChainAdapterArgs) {
    if (args.chainId) {
      try {
        const { chain } = caip2.fromCAIP2(args.chainId)
        if (chain !== ChainTypes.Bitcoin) {
          throw new Error()
        }
        this.chainId = args.chainId
      } catch (e) {
        throw new Error(`The ChainID ${args.chainId} is not supported`)
      }
    }
    this.providers = args.providers
    this.coinName = args.coinName
  }

  getType(): ChainTypes.Bitcoin {
    return ChainTypes.Bitcoin
  }

  getCaip2(): CAIP2 {
    return this.chainId
  }

  getChainId(): CAIP2 {
    return this.chainId
  }

  private async getPublicKey(
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

  async getAccount(pubkey: string): Promise<chainAdapters.Account<ChainTypes.Bitcoin>> {
    if (!pubkey) {
      return ErrorHandler('BitcoinChainAdapter: pubkey parameter is not defined')
    }

    try {
      const caip = await this.getCaip2()
      const { chain, network } = caip2.fromCAIP2(caip)
      const { data } = await this.providers.http.getAccount({ pubkey: pubkey })

      const balance = bnOrZero(data.balance).plus(bnOrZero(data.unconfirmedBalance))

      return {
        balance: balance.toString(),
        chain: ChainTypes.Bitcoin,
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
      }
    } catch (err) {
      return ErrorHandler(err)
    }
  }

  buildBIP44Params(params: Partial<BIP44Params>): BIP44Params {
    return { ...ChainAdapter.defaultBIP44Params, ...params }
  }

  async getTxHistory(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    input: chainAdapters.TxHistoryInput
  ): Promise<chainAdapters.TxHistoryResponse<ChainTypes.Bitcoin>> {
    throw new Error('Method not implemented.')
  }

  async buildSendTransaction(tx: chainAdapters.BuildSendTxInput<ChainTypes.Bitcoin>): Promise<{
    txToSign: chainAdapters.ChainTxType<ChainTypes.Bitcoin>
  }> {
    try {
      const {
        value,
        to,
        wallet,
        bip44Params = ChainAdapter.defaultBIP44Params,
        chainSpecific: { satoshiPerByte, accountType },
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

      type MappedUtxos = Omit<unchained.bitcoin.Utxo, 'value'> & { value: number }
      const mappedUtxos: MappedUtxos[] = utxos.map((x) => ({ ...x, value: Number(x.value) }))

      let coinSelectResult
      if (sendMax) {
        coinSelectResult = split(mappedUtxos, [{ address: to }], Number(satoshiPerByte))
      } else {
        coinSelectResult = coinSelect<MappedUtxos, chainAdapters.bitcoin.Recipient>(
          mappedUtxos,
          [{ value: Number(value), address: to }],
          Number(satoshiPerByte)
        )
      }
      if (!coinSelectResult || !coinSelectResult.inputs || !coinSelectResult.outputs) {
        throw new Error("BitcoinChainAdapter: coinSelect didn't select coins")
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
        outputs: signTxOutputs
      }
      return { txToSign }
    } catch (err) {
      return ErrorHandler(err)
    }
  }

  async signTransaction(
    signTxInput: chainAdapters.SignTxInput<chainAdapters.ChainTxType<ChainTypes.Bitcoin>>
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

  async broadcastTransaction(hex: string): Promise<string> {
    const broadcastedTx = await this.providers.http.sendTx({ sendTxBody: { hex } })
    return broadcastedTx.data
  }

  async getFeeData({
    to,
    value,
    chainSpecific: { pubkey },
    sendMax = false
  }: chainAdapters.GetFeeDataInput<ChainTypes.Bitcoin>): Promise<
    chainAdapters.FeeDataEstimate<ChainTypes.Bitcoin>
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

    type MappedUtxos = Omit<unchained.bitcoin.Utxo, 'value'> & { value: number }
    const mappedUtxos: MappedUtxos[] = utxos.map((x) => ({ ...x, value: Number(x.value) }))

    let fastFee
    let averageFee
    let slowFee
    if (sendMax) {
      fastFee = 0
      averageFee = 0
      slowFee = 0
      const sendMaxResultFast = split(mappedUtxos, [{ address: to }], Number(fastPerByte))
      const sendMaxResultAverage = split(mappedUtxos, [{ address: to }], Number(averagePerByte))
      const sendMaxResultSlow = split(mappedUtxos, [{ address: to }], Number(slowPerByte))
      fastFee = sendMaxResultFast.fee
      averageFee = sendMaxResultAverage.fee
      slowFee = sendMaxResultSlow.fee
    } else {
      const { fee: fast } = coinSelect<MappedUtxos, chainAdapters.bitcoin.Recipient>(
        mappedUtxos,
        [{ value: Number(value), address: to }],
        Number(fastPerByte)
      )
      const { fee: average } = coinSelect<MappedUtxos, chainAdapters.bitcoin.Recipient>(
        mappedUtxos,
        [{ value: Number(value), address: to }],
        Number(averagePerByte)
      )
      const { fee: slow } = coinSelect<MappedUtxos, chainAdapters.bitcoin.Recipient>(
        mappedUtxos,
        [{ value: Number(value), address: to }],
        Number(slowPerByte)
      )
      fastFee = fast
      averageFee = average
      slowFee = slow
    }

    return {
      [chainAdapters.FeeDataKey.Fast]: {
        txFee: String(fastFee),
        chainSpecific: {
          satoshiPerByte: fastPerByte
        }
      },
      [chainAdapters.FeeDataKey.Average]: {
        txFee: String(averageFee),
        chainSpecific: {
          satoshiPerByte: averagePerByte
        }
      },
      [chainAdapters.FeeDataKey.Slow]: {
        txFee: String(slowFee),
        chainSpecific: {
          satoshiPerByte: slowPerByte
        }
      }
    }
  }

  async getAddress({
    wallet,
    bip44Params = ChainAdapter.defaultBIP44Params,
    accountType = UtxoAccountType.SegwitP2sh,
    showOnDevice = false
  }: chainAdapters.bitcoin.GetAddressInput): Promise<string> {
    if (!supportsBTC(wallet)) {
      throw new Error('BitcoinChainAdapter: wallet does not support btc')
    }

    const { isChange } = bip44Params
    let { index } = bip44Params

    // If an index is not passed in, we want to use the newest unused change/receive indices
    if (index === undefined) {
      const { xpub } = await this.getPublicKey(wallet, bip44Params, accountType)
      const account = await this.getAccount(xpub)
      index = isChange
        ? account.chainSpecific.nextChangeAddressIndex
        : account.chainSpecific.nextReceiveAddressIndex
    }

    const path = toPath({ ...bip44Params, index })
    const addressNList = path ? bip32ToAddressNList(path) : bip32ToAddressNList("m/84'/0'/0'/0/0")
    const btcAddress = await wallet.btcGetAddress({
      addressNList,
      coin: this.coinName,
      scriptType: accountTypeToScriptType[accountType],
      showDisplay: Boolean(showOnDevice)
    })
    if (!btcAddress) throw new Error('BitcoinChainAdapter: no btcAddress available from wallet')
    return btcAddress
  }

  async validateAddress(address: string): Promise<chainAdapters.ValidAddressResult> {
    const isValidAddress = WAValidator.validate(address, this.getType())
    if (isValidAddress) return { valid: true, result: chainAdapters.ValidAddressResultType.Valid }
    return { valid: false, result: chainAdapters.ValidAddressResultType.Invalid }
  }

  async subscribeTxs(
    input: chainAdapters.SubscribeTxsInput,
    onMessage: (msg: chainAdapters.Transaction<ChainTypes.Bitcoin>) => void,
    onError: (err: chainAdapters.SubscribeError) => void
  ): Promise<void> {
    const {
      wallet,
      bip44Params = ChainAdapter.defaultBIP44Params,
      accountType = UtxoAccountType.SegwitNative
    } = input

    const { xpub } = await this.getPublicKey(wallet, bip44Params, accountType)
    const account = await this.getAccount(xpub)
    const addresses = (account.chainSpecific.addresses ?? []).map((address) => address.pubkey)
    const subscriptionId = `${toRootDerivationPath(bip44Params)}/${accountType}`

    await this.providers.ws.subscribeTxs(
      subscriptionId,
      { topic: 'txs', addresses },
      ({ data: tx }) => {
        const transfers = tx.transfers.map<chainAdapters.TxTransfer>((transfer) => ({
          caip19: transfer.caip19,
          from: transfer.from,
          to: transfer.to,
          type: getType(transfer.type),
          value: transfer.totalValue
        }))

        onMessage({
          address: tx.address,
          blockHash: tx.blockHash,
          blockHeight: tx.blockHeight,
          blockTime: tx.blockTime,
          caip2: tx.caip2,
          chain: ChainTypes.Bitcoin,
          confirmations: tx.confirmations,
          fee: tx.fee,
          status: getStatus(tx.status),
          tradeDetails: tx.trade,
          transfers,
          txid: tx.txid
        })
      },
      (err) => onError({ message: err.message })
    )
  }

  unsubscribeTxs(input?: chainAdapters.SubscribeTxsInput): void {
    if (!input) return this.providers.ws.unsubscribeTxs()

    const {
      bip44Params = ChainAdapter.defaultBIP44Params,
      accountType = UtxoAccountType.SegwitNative
    } = input
    const subscriptionId = `${toRootDerivationPath(bip44Params)}/${accountType}`

    this.providers.ws.unsubscribeTxs(subscriptionId, { topic: 'txs', addresses: [] })
  }

  closeTxs(): void {
    this.providers.ws.close('txs')
  }
}
