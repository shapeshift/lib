import {
  BuildSendTxInput,
  FeeData,
  ChainTypes,
  ValidAddressResult,
  ValidAddressResultType
} from '@shapeshiftoss/types'
import { ErrorHandler } from '../error/ErrorHandler'
import { bip32ToAddressNList, BTCInputScriptType, BTCSignTx } from '@shapeshiftoss/hdwallet-core'
import axios from 'axios'
import { Bitcoin } from '@shapeshiftoss/unchained-client'
import WAValidator from 'multicoin-address-validator'
import { ChainAdapter } from '..'
import coinSelect from 'coinselect'
import { Params } from '../types/Params.type'

const MIN_RELAY_FEE = 3000 // sats/kbyte
const DEFAULT_FEE = undefined

export type BitcoinChainAdapterDependencies = {
  provider: Bitcoin.V1Api
}

export class BitcoinChainAdapter implements ChainAdapter<ChainTypes.Bitcoin> {
  private readonly provider: Bitcoin.V1Api

  constructor(deps: BitcoinChainAdapterDependencies) {
    this.provider = deps.provider
  }

  getType(): ChainTypes.Bitcoin {
    return ChainTypes.Bitcoin
  }

  async getAccount(address: string): Promise<Bitcoin.BitcoinAccount> {
    if (!address) {
      return ErrorHandler('Address parameter is not defined')
    }
    try {
      const { data } = await this.provider.getAccount({ pubkey: address })
      return data
    } catch (err) {
      return ErrorHandler(err)
    }
  }

  async getTxHistory(address: string, params?: Params): Promise<Bitcoin.TxHistory> {
    if (!address) {
      // return ErrorHandler(new Error('Address parameter is not defined'))
      return ErrorHandler('Address parameter is not defined')
    }
    try {
      const { data } = await this.provider.getTxHistory({ pubkey: address, ...params })
      return data
    } catch (err) {
      return ErrorHandler(err)
    }
  }

  async buildSendTransaction(
    tx: BuildSendTxInput
  ): Promise<{ txToSign: BTCSignTx; estimatedFees?: FeeData }> {
    try {
      const {
        recipients,
        fee: satoshiPerByte,
        wallet,
        opReturnData,
        purpose = 84,
        scriptType = BTCInputScriptType.SpendWitness,
        account = 0
      } = tx
      const publicKeys = await wallet.getPublicKeys([
        {
          coin: 'Bitcoin',
          addressNList: bip32ToAddressNList(`m/${String(purpose)}'/0'/${String(account)}'`),
          curve: 'secp256k1',
          scriptType: scriptType ? scriptType : BTCInputScriptType.SpendWitness
        }
      ])
      if (publicKeys) {
        const pubkey = publicKeys[0].xpub
        const { data: utxos } = await this.provider.getUtxos({
          pubkey
        })

        const changeAddress = await this.getAddress({
          wallet,
          purpose,
          account,
          isChange: true,
          scriptType: BTCInputScriptType.SpendWitness
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

        const formattedOutputs = outputs.map((out: Recipient) => {
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

        const txToSign = {
          coin: 'bitcoin',
          inputs,
          outputs: formattedOutputs,
          fee,
          opReturnData
        }
        return { txToSign }
      } else {
        return undefined
      }
    } catch (err) {
      return ErrorHandler(err)
    }
  }

  async signTransaction(signTxInput: SignBitcoinTxInput): Promise<string> {
    try {
      const { txToSign, wallet } = signTxInput
      const signedTx = await wallet.btcSignTx(txToSign)
      if (!signedTx) ErrorHandler('Error signing tx')

      return signedTx.serializedTx
    } catch (err) {
      return ErrorHandler(err)
    }
  }

  async broadcastTransaction(hex: string): Promise<string> {
    const broadcastedTx = await this.provider.sendTx({ sendTxBody: { hex } })
    return broadcastedTx.data
  }

  async getFeeData(): Promise<FeeData> {
    const responseData = (await axios.get('https://bitcoinfees.earn.com/api/v1/fees/list'))['data']
    const confTimes: FeeData = {
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
      for (const fee of responseData['fees']) {
        if (fee['maxMinutes'] < confTime['maxMinutes']) {
          confTime['fee'] = Math.max(fee['minFee'] * 1024, MIN_RELAY_FEE)
          confTime['minMinutes'] = fee['minMinutes']
          confTime['maxMinutes'] = fee['maxMinutes']
          break
        }
      }
      if (confTime['fee'] === undefined) {
        confTime['fee'] = Math.max(responseData.length[-1]['minFee'] * 1024, MIN_RELAY_FEE)
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
  }: GetAddressParams): Promise<string> {
    const change = isChange ? '1' : '0'

    // If an index is not passed in, we want to use the newest unused change/receive indices
    if (index === undefined) {
      const publicKeys = await wallet.getPublicKeys([
        {
          coin: 'Bitcoin',
          addressNList: bip32ToAddressNList(`m/${String(purpose)}'/0'/0'`),
          curve: 'secp256k1',
          scriptType
        }
      ])
      if (publicKeys) {
        const pubkey = publicKeys[0].xpub
        const accountData = await this.getAccount(pubkey)
        index = isChange ? accountData.nextChangeAddressIndex : accountData.nextReceiveAddressIndex
      } else {
        return ErrorHandler(new Error("Unable to get wallet's pubkeys"))
      }
    }

    const path = `m/${String(purpose)}'/0'/${String(account)}'/${change}/${index}`
    const addressNList = path ? bip32ToAddressNList(path) : bip32ToAddressNList("m/84'/0'/0'/0/0")
    const btcAddress = await wallet.btcGetAddress({
      addressNList,
      coin: 'bitcoin',
      scriptType
    })
    return btcAddress
  }

  async validateAddress(address: string): Promise<ValidAddressResult> {
    const isValidAddress = WAValidator.validate(address, this.getType())
    if (isValidAddress) return { valid: true, result: ValidAddressResultType.Valid }
    return { valid: false, result: ValidAddressResultType.Invalid }
  }
}
