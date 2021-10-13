import {
  Bitcoin,
  BuildSendTxInput,
  ChainTypes,
  ValidAddressResult,
  ValidAddressResultType,
  TxHistoryResponse,
  NetworkTypes,
  Transaction,
  Account,
  BTCFeeDataEstimate,
  BTCFeeDataKey,
  ChainTxType,
  SignTxInput
} from '@shapeshiftoss/types'
import { ErrorHandler } from '../error/ErrorHandler'
import {
  bip32ToAddressNList,
  BTCInputScriptType,
  BTCOutputScriptType,
  BTCSignTx,
  BTCSignTxInput,
  BTCSignTxOutput,
  HDWallet,
  PublicKey,
  supportsBTC
} from '@shapeshiftoss/hdwallet-core'
import axios from 'axios'
import { BitcoinAPI } from '@shapeshiftoss/unchained-client'
import WAValidator from 'multicoin-address-validator'
import { ChainAdapter, TxHistoryInput } from '..'
import coinSelect from 'coinselect'
import { BTCOutputAddressType } from '@shapeshiftoss/hdwallet-core'
import { toPath } from '../bip32'

const MIN_RELAY_FEE = 3000 // sats/kbyte
const DEFAULT_FEE = undefined

export type BitcoinChainAdapterDependencies = {
  provider: BitcoinAPI.V1Api
}

type UtxoCoinName = {
  coinName: string
}

export class BitcoinChainAdapter implements ChainAdapter<ChainTypes.Bitcoin> {
  private readonly provider: BitcoinAPI.V1Api
  // TODO(0xdef1cafe): constraint this to utxo coins and refactor this to be a UTXOChainAdapter
  coinName: string

  constructor(deps: BitcoinChainAdapterDependencies & UtxoCoinName) {
    this.provider = deps.provider
    this.coinName = deps.coinName
  }

  getType(): ChainTypes.Bitcoin {
    return ChainTypes.Bitcoin
  }

  async getPubKey(wallet: HDWallet, path: string): Promise<PublicKey> {
    const publicKeys = await wallet.getPublicKeys([
      {
        coin: this.coinName,
        addressNList: bip32ToAddressNList(path),
        curve: 'secp256k1', // TODO(0xdef1cafe): from constant?
        scriptType: BTCInputScriptType.SpendWitness
      }
    ])
    if (!publicKeys?.[0]) throw new Error("couldn't get public key")
    return publicKeys[0]
  }

  async getAccount(pubkey: string): Promise<Account<ChainTypes.Bitcoin>> {
    if (!pubkey) {
      return ErrorHandler('BitcoinChainAdapter: pubkey parameter is not defined')
    }
    try {
      const { data } = await this.provider.getAccount({ pubkey: pubkey })
      return {
        balance: data.balance,
        chain: ChainTypes.Bitcoin,
        nextChangeAddressIndex: data.nextChangeAddressIndex,
        nextReceiveAddressIndex: data.nextReceiveAddressIndex,
        network: NetworkTypes.MAINNET,
        pubkey: data.pubkey,
        symbol: 'BTC'
      }
    } catch (err) {
      return ErrorHandler(err)
    }
  }

  async getTxHistory(input: TxHistoryInput): Promise<TxHistoryResponse<ChainTypes.Bitcoin>> {
    const { pubkey } = input
    if (!pubkey) {
      return ErrorHandler('pubkey parameter is not defined')
    }
    try {
      const { data } = await this.provider.getTxHistory(input)
      const chain: ChainTypes.Bitcoin = ChainTypes.Bitcoin
      const network = NetworkTypes.MAINNET
      const symbol = 'BTC'
      const chainSpecificFields = { chain, symbol, network }
      const transactions: Transaction<ChainTypes.Bitcoin>[] = data.transactions.map((tx) => ({
        ...tx,
        to: tx.to ?? '',
        blockHash: tx.blockHash ?? '',
        blockHeight: tx.blockHeight ?? 0,
        confirmations: tx.confirmations ?? 0,
        timestamp: tx.timestamp ?? 0,
        details: {
          opReturnData: ''
        },
        ...chainSpecificFields
      }))
      const result = { ...data, transactions }
      return result
    } catch (err) {
      return ErrorHandler(err)
    }
  }

  // TODO(0xdef1cafe): implement
  async nextReceiveAddressIndex(): Promise<number> {
    return 0
  }

  // TODO(0xdef1cafe): implement
  async nextChangeAddressIndex(): Promise<number> {
    // const foo = await this.getAccount(pubkey)
    return 0
  }

  async buildSendTransaction(
    tx: BuildSendTxInput
  ): Promise<{ txToSign: ChainTxType<ChainTypes.Bitcoin>; estimatedFees: BTCFeeDataEstimate }> {
    try {
      const {
        recipients,
        // fee: satoshiPerByte,
        wallet,
        scriptType = BTCInputScriptType.SpendWitness,
        bip32Params
      } = tx

      if (!recipients || !recipients.length) {
        throw new Error('BitcoinChainAdapter: recipients is required')
      }

      const path = toPath(bip32Params)

      const publicKeys = await wallet.getPublicKeys([
        {
          coin: this.coinName,
          addressNList: bip32ToAddressNList(path),
          curve: 'secp256k1', // TODO(0xdef1cafe): from constant?
          scriptType
        }
      ])

      if (!(publicKeys ?? []).length) {
        throw new Error('BitcoinChainAdapter: no public keys available from wallet')
      }
      const pubkey = publicKeys?.[0]?.xpub
      if (!pubkey) throw new Error('BitcoinChainAdapter: no pubkey available from wallet')
      const { data: utxos } = await this.provider.getUtxos({
        pubkey
      })

      const estimatedFees = await this.getFeeData()
      const satoshiPerByte = estimatedFees[BTCFeeDataKey.Fastest]

      type MappedUtxos = Omit<BitcoinAPI.Utxo, 'value'> & { value: number }
      const mappedUtxos: MappedUtxos[] = utxos.map((x) => ({ ...x, value: Number(x.value) }))

      // TODO(0xdef1cafe): call coinSelect with each fee data estimate?
      const coinSelectResult = coinSelect<MappedUtxos, Bitcoin.Recipient>(
        mappedUtxos,
        recipients,
        Number(satoshiPerByte)
      )
      if (!coinSelectResult.inputs) {
        throw new Error("BitcoinChainAdapter: coinSelect didn't select coins")
      }

      // TODO(0xdef1cafe): not sure what to do with this fee here?
      const { inputs, outputs /*, fee */ } = coinSelectResult

      const signTxInputs: BTCSignTxInput[] = []
      for (const input of inputs) {
        if (!input.path) continue
        const getTransactionResponse = await this.provider.getTransaction({
          txid: input.txid
        })
        const inputTx = getTransactionResponse.data

        signTxInputs.push({
          addressNList: bip32ToAddressNList(input.path),
          scriptType: BTCInputScriptType.SpendWitness,
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
            addressNList: bip32ToAddressNList(`${path}/1/${this.nextChangeAddressIndex()}`),
            scriptType: BTCOutputScriptType.PayToWitness,
            isChange: true
          }
        }
        return {
          addressType: BTCOutputAddressType.Spend,
          amount,
          address: out.address,
          scriptType: BTCOutputScriptType.PayToWitness
        }
      })

      const txToSign: BTCSignTx = {
        coin: this.coinName,
        inputs: signTxInputs,
        outputs: signTxOutputs
      }

      return { txToSign, estimatedFees }
    } catch (err) {
      return ErrorHandler(err)
    }
  }

  async signTransaction(
    signTxInput: SignTxInput<ChainTxType<ChainTypes.Bitcoin>>
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
    const broadcastedTx = await this.provider.sendTx({ sendTxBody: { hex } })
    return broadcastedTx.data
  }

  async getFeeData(): Promise<BTCFeeDataEstimate> {
    const { data } = await axios.get('https://bitcoinfees.earn.com/api/v1/fees/list')
    const confTimes: BTCFeeDataEstimate = {
      [BTCFeeDataKey.Fastest]: {
        minMinutes: 0,
        maxMinutes: 36,
        effort: 5,
        fee: DEFAULT_FEE
      },
      [BTCFeeDataKey.HalfHour]: {
        minMinutes: 0,
        maxMinutes: 36,
        effort: 4,
        fee: DEFAULT_FEE
      },
      [BTCFeeDataKey.OneHour]: {
        minMinutes: 0,
        maxMinutes: 60,
        effort: 3,
        fee: DEFAULT_FEE
      },
      [BTCFeeDataKey.SixHour]: {
        minMinutes: 36,
        maxMinutes: 360,
        effort: 2,
        fee: DEFAULT_FEE
      },
      [BTCFeeDataKey.TwentyFourHour]: {
        minMinutes: 36,
        maxMinutes: 1440,
        effort: 1,
        fee: DEFAULT_FEE
      }
    }

    for (const time of Object.keys(confTimes)) {
      const confTime = confTimes[time as BTCFeeDataKey]
      for (const fee of data['fees']) {
        if (fee['maxMinutes'] < confTime['maxMinutes']) {
          confTime['fee'] = Math.max(fee['minFee'] * 1024, MIN_RELAY_FEE)
          confTime['minMinutes'] = fee['minMinutes']
          confTime['maxMinutes'] = fee['maxMinutes']
          break
        }
      }
      if (confTime['fee'] === undefined) {
        confTime['fee'] = Math.max(data.length[-1]['minFee'] * 1024, MIN_RELAY_FEE)
      }
    }

    return confTimes
  }

  async getAddress({
    wallet,
    bip32Params,
    scriptType = BTCInputScriptType.SpendWitness
  }: Bitcoin.GetAddressInput): Promise<string> {
    if (!supportsBTC(wallet)) {
      throw new Error('BitcoinChainAdapter: wallet does not support btc')
    }

    const path = toPath(bip32Params)
    const { isChange } = bip32Params
    let { index } = bip32Params

    // If an index is not passed in, we want to use the newest unused change/receive indices
    if (!index) {
      index = isChange ? await this.nextChangeAddressIndex() : await this.nextReceiveAddressIndex()
    }

    const addressNList = path ? bip32ToAddressNList(path) : bip32ToAddressNList("m/84'/0'/0'/0/0")
    const btcAddress = await wallet.btcGetAddress({
      addressNList,
      coin: this.coinName,
      scriptType
    })
    if (!btcAddress) throw new Error('BitcoinChainAdapter: no btcAddress available from wallet')
    return btcAddress
  }

  async validateAddress(address: string): Promise<ValidAddressResult> {
    const isValidAddress = WAValidator.validate(address, this.getType())
    if (isValidAddress) return { valid: true, result: ValidAddressResultType.Valid }
    return { valid: false, result: ValidAddressResultType.Invalid }
  }
}
