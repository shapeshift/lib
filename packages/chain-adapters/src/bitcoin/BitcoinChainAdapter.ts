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
import { Bitcoin } from '@shapeshiftoss/unchained-client'

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
      const utxos = this.provider.getUtxos({
        pubkey:
          'ypub6WwgXWCu9dLC5n12qZXLUJxHPT2itq9UBkVXcTmXH4Nbs5n5mh3asajLnZ4ncv7vm2frTjDqM3rxTWdqZ1GYExzxJWXy1cMZeGSefyTa1kw'
      })
      console.log('utxos: ', utxos)
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
    // const isValidAddress = WAValidator.validate(address, this.getType())
    // if (isValidAddress) return { valid: true, result: ValidAddressResultType.Valid }
    return { valid: false, result: ValidAddressResultType.Invalid }
  }
}
