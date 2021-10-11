import {
  BuildSendTxInput,
  ChainTypes,
  ValidAddressResult,
  ValidAddressResultType,
  TxHistoryResponse,
  NetworkTypes,
  Transaction,
  GetBitcoinAddressInput,
  Account,
  BitcoinAccount,
  BTCFeeDataEstimate,
  BTCRecipient,
  SignBitcoinTxInput,
  BTCFeeDataKey
} from '@shapeshiftoss/types'
import { ErrorHandler } from '../error/ErrorHandler'
import {
  bip32ToAddressNList,
  BTCInputScriptType,
  BTCSignTx,
  BTCSignTxInput,
  BTCSignTxOutput,
  supportsBTC
} from '@shapeshiftoss/hdwallet-core'
import axios from 'axios'
import { Bitcoin } from '@shapeshiftoss/unchained-client'
import WAValidator from 'multicoin-address-validator'
import { ChainAdapter, toPath, TxHistoryInput } from '..'
import coinSelect from 'coinselect'
import { FormattedUTXO } from '@shapeshiftoss/types'
import { BTCOutputAddressType } from '@shapeshiftoss/hdwallet-core'

const MIN_RELAY_FEE = 3000 // sats/kbyte
const DEFAULT_FEE = undefined

export type BitcoinChainAdapterDependencies = {
  provider: Bitcoin.V1Api
}

type UtxoCoinName = {
  coinName: string
}

export class BitcoinChainAdapter implements ChainAdapter<ChainTypes.Bitcoin> {
  private readonly provider: Bitcoin.V1Api
  // TODO(0xdef1cafe): constraint this to utxo coins and refactor this to be a UTXOChainAdapter
  coinName: string

  constructor(deps: BitcoinChainAdapterDependencies & UtxoCoinName) {
    this.provider = deps.provider
    this.coinName = deps.coinName
  }

  getType(): ChainTypes.Bitcoin {
    return ChainTypes.Bitcoin
  }

  async getAccount(address: string): Promise<Account> {
    if (!address) {
      return ErrorHandler('BitcoinChainAdapter: address parameter is not defined')
    }
    try {
      const { data: unchainedAccount } = await this.provider.getAccount({ pubkey: address })
      const result: BitcoinAccount = {
        symbol: 'BTC', // TODO(0xdef1cafe): this is fucked
        chain: ChainTypes.Bitcoin,
        network: NetworkTypes.MAINNET,
        ...unchainedAccount
      }
      return result
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
    return 0
  }

  async buildSendTransaction(
    tx: BuildSendTxInput
  ): Promise<{ txToSign: BTCSignTx; estimatedFees: BTCFeeDataEstimate }> {
    try {
      const {
        recipients,
        fee: satoshiPerByte,
        wallet,
        opReturnData,
        scriptType = BTCInputScriptType.SpendWitness,
        bip32Params
      } = tx

      if (!recipients || !recipients.length)
        throw new Error('BitcoinChainAdapter: recipients is required')

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

      const changeAddress = await this.getAddress({
        bip32Params,
        wallet,
        scriptType: BTCInputScriptType.SpendWitness
      })

      const formattedUtxos: FormattedUTXO[] = []
      for (const utxo of utxos) {
        const getTransactionResponse = await this.provider.getTransaction({
          txid: utxo.txid
        })

        const inputTx = getTransactionResponse.data
        if (utxo.path) {
          formattedUtxos.push({
            ...utxo,
            addressNList: bip32ToAddressNList(utxo.path),
            scriptType: BTCInputScriptType.SpendAddress,
            amount: String(utxo.value),
            tx: inputTx,
            hex: inputTx.hex,
            value: Number(utxo.value)
          })
        }
      }

      type CoinSelectResult = {
        inputs: Array<BTCSignTxInput>
        outputs: Array<BTCSignTxOutput>
        fee: number
      }

      const coinSelectResult: CoinSelectResult = coinSelect(
        formattedUtxos,
        recipients,
        Number(satoshiPerByte)
      )
      const { inputs, outputs, fee } = coinSelectResult

      //TODO some better error handling
      if (!inputs || !outputs) {
        ErrorHandler('BitcoinChainAdapater: error selecting inputs/outputs')
      }

      const formattedOutputs: Array<BTCSignTxOutput> = outputs.map((out: BTCRecipient) => {
        if (!out.address) {
          return {
            amount: String(out.value),
            addressType: BTCOutputAddressType.Spend,
            address: changeAddress,
            isChange: true,
            opReturnData
          }
        }
        return {
          ...out,
          amount: String(out.value),
          addressType: BTCOutputAddressType.Spend,
          isChange: false,
          opReturnData
        }
      })
      const estimatedFees = await this.getFeeData()

      const txToSign = {
        coin: this.coinName,
        inputs,
        outputs: formattedOutputs,
        fee,
        opReturnData
      }
      return { txToSign, estimatedFees }
    } catch (err) {
      return ErrorHandler(err)
    }
  }

  async signTransaction(signTxInput: SignBitcoinTxInput): Promise<string> {
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
  }: GetBitcoinAddressInput): Promise<string> {
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
