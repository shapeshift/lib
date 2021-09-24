import {
  ChainAdapter,
  BuildSendTxInput,
  // SignTxInput,
  GetFeeDataInput,
  FeeData,
  ChainIdentifier,
  ValidAddressResult,
  ValidAddressResultType,
  GetAddressParams,
  Params,
  UtxoResponse,
  SignBitcoinTxInput
} from '../api'
import { ErrorHandler } from '../error/ErrorHandler'
import {
  bip32ToAddressNList,
  BTCInputScriptType,
  BTCSignTx,
  BitcoinTx
} from '@shapeshiftoss/hdwallet-core'
import axios from 'axios'
import { Bitcoin } from '@shapeshiftoss/unchained-client'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const coinSelect = require('coinselect')
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

  buildSendTransaction = async (
    tx: BuildSendTxInput
  ): Promise<{ txToSign: BTCSignTx; estimatedFees?: FeeData } | undefined> => {
    try {
      const { recipients, fee: satoshiPerByte, wallet, opReturnData } = tx

      const publicKeys = await wallet.getPublicKeys([
        {
          coin: 'Bitcoin',
          addressNList: bip32ToAddressNList(`m/44'/0'/0'`),
          curve: 'secp256k1'
        }
      ])
      if (publicKeys) {
        const pubkey = publicKeys[0].xpub
        const { data: utxos } = await this.provider.getUtxos({
          pubkey
        })
        const accountData = await this.getAccount(pubkey)

        // TODO generate bech32 address for change
        const changeAddress = await this.getAddress({
          wallet,
          purpose: "44'",
          account: "0'",
          isChange: true,
          scriptType: BTCInputScriptType.SpendAddress
        })

        const formattedUtxos = utxos.map((utxo: UtxoResponse) => {
          let inputTx: any
          let addressPath: any
          if (accountData.transactions) {
            inputTx = accountData.transactions.find(
              (transaction: any) => transaction.txid === utxo.txid
            )
          }
          if (accountData.addresses) {
            addressPath = accountData.addresses.find((addr) => addr.pubkey === utxo.address)
          }

          for (let i = 0; i < inputTx.vin.length; i++) {
            inputTx.vin[i] = {
              vout: inputTx.vin[i].vout,
              valueSat: parseInt(inputTx.vin[i].value),
              sequence: inputTx.vin[i].sequence,
              txid: inputTx.vin[i].txid
            }
          }

          for (let i = 0; i < inputTx.vout.length; i++) {
            inputTx.vout[i] = {
              value: String(parseInt(inputTx.vout[i].value) / 100000000),
              scriptPubKey: {
                hex: inputTx.vout[i].hex
              }
            }
          }

          return {
            ...utxo,
            addressNList: bip32ToAddressNList(addressPath.path),
            scriptType: BTCInputScriptType.SpendAddress,
            amount: String(utxo.value),
            tx: inputTx,
            hex: inputTx.hex,
            value: Number(utxo.value)
          }
        })

        const { inputs, outputs, fee } = coinSelect(
          formattedUtxos,
          recipients,
          Number(satoshiPerByte)
        )

        //TODO some better error handling
        if (!inputs || !outputs) {
          throw 'Error selecting inputs/outputs'
        }

        const formattedOutputs = outputs.map((out: any) => {
          if (!out.address) {
            return {
              ...out,
              amount: String(out.value),
              addressType: 'p2pkh',
              address: changeAddress,
              scriptPubKey: {
                hex: out.hex
              },
              isChange: true
            }
          }
          return {
            ...out,
            amount: String(out.value),
            addressType: 'p2pkh',
            scriptPubKey: {
              hex: out.hex
            },
            isChange: false
          }
        })

        const txToSign: any = {
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

  signTransaction = async (signTxInput: SignBitcoinTxInput): Promise<string> => {
    try {
      const { txToSign, wallet } = signTxInput
      const signedTx = await wallet.btcSignTx(txToSign)
      if (!signedTx) throw new Error('Error signing tx')

      return signedTx.serializedTx
    } catch (err) {
      return ErrorHandler(err)
    }
  }

  broadcastTransaction = async (hex: string): Promise<string> => {
    const broadcastedTx = await this.provider.sendTx({ sendTxBody: { hex } })
    return broadcastedTx.data
  }

  getFeeData = async (): Promise<any> => {
    const responseData: any = (await axios.get('https://bitcoinfees.earn.com/api/v1/fees/list'))[
      'data'
    ]
    const confTimes: any = {
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

  getAddress = async ({
    wallet,
    purpose = "84'",
    account = "0'",
    isChange = false,
    index,
    scriptType = BTCInputScriptType.Bech32
  }: GetAddressParams): Promise<string> => {
    let path

    if (index !== 0 && !index && !isChange) {
      const { receiveIndex } = await this.getAccount(
        'xpub6CDvS4rkJBfqEyBdTo7omDxv3BwDr5XmWeKsU9HAaLSG28GztaywbAsm6SBWPyEsZ6QDubVnXtNEfDZ74RkDVeLUSkjdZDbsLZCqNWqy7wQ'
      )
      path = `m/${purpose}/${account}/0'/0/${receiveIndex}`
    }

    if (index) {
      path = `m/${purpose}/${account}/0'/0/${index}`
    }

    if (isChange) {
      const { changeIndex } = await this.getAccount(
        'xpub6CDvS4rkJBfqEyBdTo7omDxv3BwDr5XmWeKsU9HAaLSG28GztaywbAsm6SBWPyEsZ6QDubVnXtNEfDZ74RkDVeLUSkjdZDbsLZCqNWqy7wQ'
      )
      path = `m/${purpose}/${account}/0'/1/${changeIndex}`
    }

    // TODO change the 44' to 84' when we make bech32 default
    const addressNList = path ? bip32ToAddressNList(path) : bip32ToAddressNList("m/44'/0'/0'/0/0")
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
