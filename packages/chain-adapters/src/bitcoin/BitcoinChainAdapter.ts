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
  Params,
  UtxoResponse
} from '../api'
import { ErrorHandler } from '../error/ErrorHandler'
import { bip32ToAddressNList, BTCInputScriptType } from '@shapeshiftoss/hdwallet-core'
import BigNumber from 'bignumber.js'
import { Bitcoin } from '@shapeshiftoss/unchained-client'
import { Transaction } from '../../../../../hdwallet/node_modules/@bithighlander/bitcoin-cash-js-lib/types'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const coinSelect = require('coinselect')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const bitcoin = require('bitcoinjs-lib')

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

  buildSendTransaction = async (tx: any): Promise<any> => {
    //Promise<{ txToSign: BTCSignTx; estimatedFees: FeeData }> => {
    try {
      const { recipients, fee: satoshiPerByte, wallet, path } = tx

      const { data: utxos } = await this.provider.getUtxos({
        pubkey:
          'xpub6CDvS4rkJBfqEyBdTo7omDxv3BwDr5XmWeKsU9HAaLSG28GztaywbAsm6SBWPyEsZ6QDubVnXtNEfDZ74RkDVeLUSkjdZDbsLZCqNWqy7wQ'
      })

      const accountData = await this.getAccount(
        'xpub6CDvS4rkJBfqEyBdTo7omDxv3BwDr5XmWeKsU9HAaLSG28GztaywbAsm6SBWPyEsZ6QDubVnXtNEfDZ74RkDVeLUSkjdZDbsLZCqNWqy7wQ'
      )

      console.log('fuckin accountData damnit: ', accountData)

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
          //TODO type this
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
            scriptSig: {
              hex: '0014459a4d8600bfdaa52708eaae5be1dcf959069efc'
            },
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

        const hex = inputTx.hex
        delete inputTx.blockHash
        delete inputTx.blockHeight
        delete inputTx.confirmations
        delete inputTx.blockTime
        delete inputTx.value
        delete inputTx.valueIn
        delete inputTx.fees
        delete inputTx.hex
        delete inputTx.txid
        // inputTx.locktime = 0

        return {
          ...utxo,
          addressNList: bip32ToAddressNList(addressPath.path),
          scriptType: BTCInputScriptType.SpendAddress,
          amount: String(utxo.value),
          tx: inputTx,
          hex,
          // scriptSig: {
          //   hex: '0014459a4d8600bfdaa52708eaae5be1dcf959069efc'
          // },
          value: Number(utxo.value)
          // nonWitnessUtxo: Buffer.from(inputTx.hex, 'hex')
        }
      })

      console.log('formattedUtxos: ', formattedUtxos)

      let { inputs, outputs, fee } = coinSelect(formattedUtxos, recipients, Number(satoshiPerByte))

      console.log('coinSelect inputs: ', inputs)
      console.log('coinSelect outputs: ', outputs)
      console.log('coinSelect inpufeets: ', fee)

      //TODO some better error handling
      if (!inputs || !outputs) return 'Failed to build tx'

      outputs = outputs.map((out: any) => {
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
        outputs,
        fee,
        // version: 1,
        // locktime: 0,
        opReturnData: 'sup fool'
      }
      return { txToSign }
    } catch (err) {
      return ErrorHandler(err)
    }
  }

  signTransaction = async (signTxInput: any): Promise<string> => {
    try {
      // console.log('signTxInput in signTransaction: ', signTxInput.txToSign.inputs)

      // const inputs = [
      //   {
      //     addressNList: bip32ToAddressNList('m/0'),
      //     scriptType: BTCInputScriptType.SpendAddress,
      //     amount: String(390000),
      //     vout: 0,
      //     txid: 'd5f65ee80147b4bcc70b75e4bbf2d7382021b871bd8867ef8fa525ef50864882',
      //     tx: {
      //       version: 1,
      //       locktime: 0,
      //       vin: [
      //         {
      //           vout: 1,
      //           valueSat: 200000,
      //           sequence: 4294967295,
      //           scriptSig: {
      //             hex:
      //               '483045022072ba61305fe7cb542d142b8f3299a7b10f9ea61f6ffaab5dca8142601869d53c0221009a8027ed79eb3b9bc13577ac2853269323434558528c6b6a7e542be46e7e9a820141047a2d177c0f3626fc68c53610b0270fa6156181f46586c679ba6a88b34c6f4874686390b4d92e5769fbb89c8050b984f4ec0b257a0e5c4ff8bd3b035a51709503'
      //           },
      //           txid: 'c16a03f1cf8f99f6b5297ab614586cacec784c2d259af245909dedb0e39eddcf'
      //         },
      //         {
      //           vout: 1,
      //           valueSat: 200000,
      //           sequence: 4294967295,
      //           scriptSig: {
      //             hex:
      //               '48304502200fd63adc8f6cb34359dc6cca9e5458d7ea50376cbd0a74514880735e6d1b8a4c0221008b6ead7fe5fbdab7319d6dfede3a0bc8e2a7c5b5a9301636d1de4aa31a3ee9b101410486ad608470d796236b003635718dfc07c0cac0cfc3bfc3079e4f491b0426f0676e6643a39198e8e7bdaffb94f4b49ea21baa107ec2e237368872836073668214'
      //           },
      //           txid: '1ae39a2f8d59670c8fc61179148a8e61e039d0d9e8ab08610cb69b4a19453eaf'
      //         }
      //       ],
      //       vout: [
      //         {
      //           value: '0.00390000',
      //           scriptPubKey: {
      //             hex: '76a91424a56db43cf6f2b02e838ea493f95d8d6047423188ac'
      //           }
      //         }
      //       ]
      //     },
      //     hex:
      //       '0100000002cfdd9ee3b0ed9d9045f29a252d4c78ecac6c5814b67a29b5f6998fcff1036ac1010000008b483045022072ba61305fe7cb542d142b8f3299a7b10f9ea61f6ffaab5dca8142601869d53c0221009a8027ed79eb3b9bc13577ac2853269323434558528c6b6a7e542be46e7e9a820141047a2d177c0f3626fc68c53610b0270fa6156181f46586c679ba6a88b34c6f4874686390b4d92e5769fbb89c8050b984f4ec0b257a0e5c4ff8bd3b035a51709503ffffffffaf3e45194a9bb60c6108abe8d9d039e0618e8a147911c68f0c67598d2f9ae31a010000008b48304502200fd63adc8f6cb34359dc6cca9e5458d7ea50376cbd0a74514880735e6d1b8a4c0221008b6ead7fe5fbdab7319d6dfede3a0bc8e2a7c5b5a9301636d1de4aa31a3ee9b101410486ad608470d796236b003635718dfc07c0cac0cfc3bfc3079e4f491b0426f0676e6643a39198e8e7bdaffb94f4b49ea21baa107ec2e237368872836073668214ffffffff0170f30500000000001976a91424a56db43cf6f2b02e838ea493f95d8d6047423188ac00000000'
      //   }
      // ]

      const { txToSign, wallet } = signTxInput

      // const newOutputs: any = [
      //   {
      //     address: '1MJ2tj2ThBE62zXbBYA5ZaN3fdve5CPAz1',
      //     addressType: 'p2pkh',
      //     // scriptType: core.BTCOutputScriptType.PayToAddress,
      //     amount: String(390000 - 10000),
      //     isChange: false
      //   }
      // ]

      for (let i = 0; i < txToSign.inputs.length; i++) {
        delete txToSign.inputs[i].address
        delete txToSign.inputs[i].value
        delete txToSign.inputs[i].confirmations
      }

      for (let i = 0; i < txToSign.outputs.length; i++) {
        delete txToSign.outputs[i].scriptPubKey
        delete txToSign.outputs[i].value
      }

      console.log('Signing inputs: ', JSON.stringify(txToSign.inputs))
      console.log(' Signing outputs: ', JSON.stringify(txToSign.outputs))

      const newTxToSign: any = {
        coin: txToSign.coin,
        fee: txToSign.fee,
        inputs: txToSign.inputs,
        outputs: txToSign.outputs
      }

      const signedTx = await wallet.btcSignTx(newTxToSign)

      if (!signedTx) throw new Error('Error signing tx')

      return signedTx.serialized
    } catch (err) {
      return ErrorHandler(err)
    }
  }

  broadcastTransaction = async (hex: string) => {
    // return this.provider.broadcastTx(hex)
    return 'dope'
  }

  getFeeData = async ({ to, from, contractAddress, value }: GetFeeDataInput): Promise<FeeData> => {
    // const { data: responseData } = await axios.get<ZrxGasApiResponse>('https://gas.api.0x.org/')
    // const fees = responseData.result.find((result) => result.source === 'MEDIAN')

    // if (!fees) throw new TypeError('BTC fee should always exist')

    // const data = await getErc20Data(to, value, contractAddress)
    // const feeUnits = await this.provider.getFeeUnits({
    //   from,
    //   to,
    //   value,
    //   data
    // })

    // // PAD LIMIT
    // const gasLimit = new BigNumber(feeUnits).times(2).toString()

    return {
      fast: {
        feeUnits: '100',
        feeUnitPrice: '111',
        networkFee: new BigNumber(1).toPrecision()
      },
      average: {
        feeUnits: '100',
        feeUnitPrice: '111',
        networkFee: new BigNumber(1).toPrecision()
      },
      slow: {
        feeUnits: '100',
        feeUnitPrice: '111',
        networkFee: new BigNumber(1).toPrecision()
      }
    }
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
    console.log('address: ', address)
    // const isValidAddress = WAValidator.validate(address, this.getType())
    // if (isValidAddress) return { valid: true, result: ValidAddressResultType.Valid }
    return { valid: false, result: ValidAddressResultType.Invalid }
  }
}
