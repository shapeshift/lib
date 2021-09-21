import {
  ChainAdapter,
  BuildSendTxInput,
  SignTxInput,
  GetFeeDataInput,
  FeeData,
  ChainIdentifier,
  ValidAddressResult,
  ValidAddressResultType,
  GetAddressParams,
  Params
} from '../api'
import { ErrorHandler } from '../error/ErrorHandler'
import { bip32ToAddressNList, BTCInputScriptType } from '@shapeshiftoss/hdwallet-core'
import BigNumber from 'bignumber.js'
import axios from 'axios'
import { Bitcoin } from '@shapeshiftoss/unchained-client'
import WAValidator from 'multicoin-address-validator'

const MIN_RELAY_FEE = 3000 // sats/kbyte
const DEFAULT_FEE = undefined

export type BitcoinChainAdapterDependencies = {
  provider: Bitcoin.V1Api
}

export class BitcoinChainAdapter implements ChainAdapter {
  private readonly provider: Bitcoin.V1Api

  constructor(deps: BitcoinChainAdapterDependencies) {
    this.provider = deps.provider
  }

  getType = (): ChainIdentifier => {
    return ChainIdentifier.Bitcoin
  }

  getAccount = async (address: string): Promise<Bitcoin.BitcoinAccount> => {
    try {
      const { data } = await this.provider.getAccount({ pubkey: address })
      return data
    } catch (err) {
      return ErrorHandler(err)
    }
  }

  getTxHistory = async (address: string, params?: Params): Promise<Bitcoin.TxHistory> => {
    try {
      const { data } = await this.provider.getTxHistory({ pubkey: address, ...params })
      return data
    } catch (err) {
      return ErrorHandler(err)
    }
  }

  buildSendTransaction = async (tx: BuildSendTxInput): Promise<any> => {
    //Promise<{ txToSign: BTCSignTx; estimatedFees: FeeData }> => {
    try {
      const { to, value, fee, wallet } = tx
      const { data: utxos } = await this.provider.getUtxos({
        pubkey:
          'ypub6WwgXWCu9dLC5n12qZXLUJxHPT2itq9UBkVXcTmXH4Nbs5n5mh3asajLnZ4ncv7vm2frTjDqM3rxTWdqZ1GYExzxJWXy1cMZeGSefyTa1kw'
      })

      const { data: account } = await this.provider.getAccount({
        pubkey:
          'ypub6WwgXWCu9dLC5n12qZXLUJxHPT2itq9UBkVXcTmXH4Nbs5n5mh3asajLnZ4ncv7vm2frTjDqM3rxTWdqZ1GYExzxJWXy1cMZeGSefyTa1kw'
      })
      console.log('account: ', account)
      // console.log('utxos: ', utxos)
      // const { to, erc20ContractAddress, path, wallet, fee, limit } = tx
      // const value = erc20ContractAddress ? '0' : tx?.value
      // const destAddress = erc20ContractAddress ?? to

      // const addressNList = bip32ToAddressNList(path)

      // const estimatedFees = await this.getFeeData({
      //   to,
      //   from,
      //   value,
      //   contractAddress: erc20ContractAddress
      // })

      // const txToSign: BTCSignTx = {
      //   coin: 'bitcoin',
      //   inputs,
      //   outputs
      // }
      // return { txToSign, estimatedFees }
      return 'dope'
    } catch (err) {
      return ErrorHandler(err)
    }
  }

  signTransaction = async (signTxInput: SignTxInput): Promise<string> => {
    try {
      // const { txToSign, wallet } = signTxInput
      // const signedTx = await (wallet as BTCWallet).btcSignTx(txToSign)

      // if (!signedTx) throw new Error('Error signing tx')

      // return signedTx.serialized
      return 'dope'
    } catch (err) {
      return ErrorHandler(err)
    }
  }

  broadcastTransaction = async (hex: string) => {
    // return this.provider.broadcastTx(hex)
    return 'dope'
  }

  getFeeData = async (): Promise<any> => {
    const responseData: any = (await axios.get('https://bitcoinfees.earn.com/api/v1/fees/list'))[
      'data'
    ]
    let confTimes: any = {
      fastest: {
        maxMinutes: 36,
        effort: 5,
        fee: DEFAULT_FEE
      },
      halfHour: {
        maxMinutes: 36,
        effort: 4,
        fee: DEFAULT_FEE
      },
      '1hour': {
        maxMinutes: 60,
        effort: 3,
        fee: DEFAULT_FEE
      },
      '6hour': {
        maxMinutes: 360,
        effort: 2,
        fee: DEFAULT_FEE
      },
      '24hour': {
        maxMinutes: 1440,
        effort: 1,
        fee: DEFAULT_FEE
      }
    }

    for (const time of Object.keys(confTimes)) {
      for (const fee of responseData['fees']) {
        if (fee['maxMinutes'] < confTimes[time]['maxMinutes']) {
          confTimes[time]['fee'] = Math.max(fee['minFee'] * 1024, MIN_RELAY_FEE)
          confTimes[time]['minMinutes'] = fee['minMinutes']
          confTimes[time]['maxMinutes'] = fee['maxMinutes']
          break
        }
      }
      if (confTimes[time]['fee'] === undefined) {
        confTimes[time]['fee'] = Math.max(responseData.length[-1]['minFee'] * 1024, MIN_RELAY_FEE)
      }
    }

    return confTimes
  }

  getAddress = async ({ wallet, path }: GetAddressParams): Promise<string> => {
    const addressNList = bip32ToAddressNList(path)
    const btcAddress = await wallet.btcGetAddress({
      addressNList,
      coin: 'bitcoin',
      scriptType: BTCInputScriptType.SpendAddress
    })
    return btcAddress
  }

  async validateAddress(address: string): Promise<ValidAddressResult> {
    console.log('address: ', address)
    const isValidAddress = WAValidator.validate(address, this.getType())
    if (isValidAddress) return { valid: true, result: ValidAddressResultType.Valid }
    return { valid: false, result: ValidAddressResultType.Invalid }
  }
}
