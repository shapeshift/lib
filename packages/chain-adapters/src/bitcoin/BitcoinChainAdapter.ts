import {
  BTCFeeDataEstimate,
  BTCFeeDataKey,
  BTCRecipient,
  SignBitcoinTxInput
} from './../../../types/src/types'
import {
  BuildSendTxInput,
  ChainTypes,
  ValidAddressResult,
  ValidAddressResultType,
  TxHistoryResponse,
  NetworkTypes,
  Transaction,
  GetBitcoinAddressInput,
  Account
} from '@shapeshiftoss/types'
import { ErrorHandler } from '../error/ErrorHandler'
import {
  bip32ToAddressNList,
  BTCInputScriptType,
  BTCSignTx,
  supportsBTC
} from '@shapeshiftoss/hdwallet-core'
import axios from 'axios'
import { Bitcoin } from '@shapeshiftoss/unchained-client'
import WAValidator from 'multicoin-address-validator'
import { ChainAdapter, TxHistoryInput } from '..'
import coinSelect from 'coinselect'

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
      const { data } = await this.provider.getAccount({ pubkey: address })
      return data
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

  async nextReceiveAddress() {}

  async nextReceiveAddress() {}

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

      const { purpose, accountNumber } = bip32Params

      const publicKeys = await wallet.getPublicKeys([
        {
          coin: this.coinName,
          addressNList: bip32ToAddressNList(`m/${String(purpose)}'/0'/${String(account)}'`),
          curve: 'secp256k1',
          scriptType: scriptType ? scriptType : BTCInputScriptType.SpendWitness
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
        wallet,
        purpose,
        account,
        isChange: true,
        scriptType: BTCInputScriptType.SpendWitness,
        path
      })

      const formattedUtxos = []
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

      const { inputs, outputs, fee } = coinSelect(
        formattedUtxos,
        recipients,
        Number(satoshiPerByte)
      )

      //TODO some better error handling
      if (!inputs || !outputs) {
        ErrorHandler('Error selecting inputs/outputs')
      }

      const formattedOutputs = outputs.map((out: BTCRecipient) => {
        if (!out.address) {
          return {
            amount: String(out.value),
            addressType: BTCInputScriptType.SpendWitness,
            address: changeAddress,
            isChange: true
          }
        }
        return {
          ...out,
          amount: String(out.value),
          addressType: BTCInputScriptType.SpendWitness,
          isChange: false
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
    purpose = 84,
    account = 0,
    isChange = false,
    index,
    scriptType = BTCInputScriptType.SpendWitness
  }: GetBitcoinAddressInput): Promise<string> {
    if (!supportsBTC(wallet)) {
      throw new Error('BitcoinChainAdapter: wallet does not support btc')
    }
    const change = isChange ? '1' : '0'

    // If an index is not passed in, we want to use the newest unused change/receive indices
    if (!index) {
      const publicKeys = await wallet.getPublicKeys([
        {
          coin: this.coinName,
          addressNList: bip32ToAddressNList(`m/${String(purpose)}'/0'/0'`),
          curve: 'secp256k1',
          scriptType
        }
      ])
      if (publicKeys?.length) {
        throw new Error('BitcoinChainAdapter: no pubkeys available from wallet')
      }
      const pubkey = publicKeys?.[0]?.xpub
      if (!pubkey) throw new Error('BitcoinChainAdapter: no pubkey available from wallet')
      const accountData = await this.getAccount(pubkey)
      // TODO(0xdef1cafe): check w/ kevman if these types coming back from unchained should
      // always be defined
      index = isChange
        ? accountData?.nextChangeAddressIndex ?? 0
        : accountData?.nextReceiveAddressIndex ?? 0
    }

    const path = `m/${String(purpose)}'/0'/${String(account)}'/${change}/${index}`
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
