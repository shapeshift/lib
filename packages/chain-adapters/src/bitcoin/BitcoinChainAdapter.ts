import {
  ChainAdapter,
  TxHistoryResponse,
  BuildSendTxInput,
  SignTxInput,
  GetAddressInput,
  GetFeeDataInput,
  FeeData,
  BalanceResponse,
  ChainIdentifier,
  ValidAddressResult,
  ValidAddressResultType,
  GetAddressParams
} from '../api'
import { BlockchainProvider } from '../types/BlockchainProvider.type'
import { Params } from '../types/Params.type'
import { ErrorHandler } from '../error/ErrorHandler'
import {
  bip32ToAddressNList,
  BTCSignTx,
  BTCWallet,
  BTCInputScriptType
} from '@shapeshiftoss/hdwallet-core'
import { numberToHex } from 'web3-utils'
import axios from 'axios'
import BigNumber from 'bignumber.js'

export type BitcoinChainAdapterDependencies = {
  provider: BlockchainProvider
}

export class BitcoinChainAdapter {
  //implements ChainAdapter {
  private readonly provider: BlockchainProvider

  constructor(deps: BitcoinChainAdapterDependencies) {
    this.provider = deps.provider
  }

  getType = (): ChainIdentifier => {
    return ChainIdentifier.Bitcoin
  }

  getBalance = async (address: string): Promise<BalanceResponse | undefined> => {
    try {
      const balanceData = await this.provider.getAccount(address)
      return balanceData
    } catch (err) {
      return ErrorHandler(err)
    }
  }

  // getTxHistory = async (address: string, params?: Params): Promise<TxHistoryResponse> => {
  //   try {
  //     return this.provider.getTxHistory(address, params)
  //   } catch (err) {
  //     return ErrorHandler(err)
  //   }
  // }

  // buildSendTransaction = async (tx: BuildSendTxInput): Promise<any> => {
  //   //Promise<{ txToSign: BTCSignTx; estimatedFees: FeeData }> => {
  //   try {
  //     const { to, erc20ContractAddress, path, wallet, fee, limit } = tx
  //     const value = erc20ContractAddress ? '0' : tx?.value
  //     const destAddress = erc20ContractAddress ?? to

  //     const addressNList = bip32ToAddressNList(path)

  //     const from = await this.getAddress({ wallet, path })
  //     const nonce = await this.provider.getNonce(from)

  //     let gasPrice = fee
  //     let gasLimit = limit
  //     const estimatedFees = await this.getFeeData({
  //       to,
  //       from,
  //       value,
  //       contractAddress: erc20ContractAddress
  //     })

  //     if (!gasPrice || !gasLimit) {
  //       // Default to average gas price if fee is not passed
  //       !gasPrice && (gasPrice = estimatedFees.average.feeUnitPrice)
  //       !gasLimit && (gasLimit = estimatedFees.average.feeUnits)
  //     }

  //     const txToSign: BTCSignTx = {
  //       value: numberToHex(value),
  //       to: destAddress,
  //       chainId: 1, // TODO: implement for multiple chains
  //       nonce: String(nonce),
  //       gasPrice: numberToHex(gasPrice),
  //       gasLimit: numberToHex(gasLimit)
  //     }
  //     return { txToSign, estimatedFees }
  //   } catch (err) {
  //     return ErrorHandler(err)
  //   }
  // }

  // signTransaction = async (signTxInput: SignTxInput): Promise<string> => {
  //   try {
  //     const { txToSign, wallet } = signTxInput
  //     const signedTx = await (wallet as BTCWallet).btcSignTx(txToSign)

  //     if (!signedTx) throw new Error('Error signing tx')

  //     return signedTx.serialized
  //   } catch (err) {
  //     return ErrorHandler(err)
  //   }
  // }

  // broadcastTransaction = async (hex: string) => {
  //   return this.provider.broadcastTx(hex)
  // }

  // getFeeData = async ({ to, from, contractAddress, value }: GetFeeDataInput): Promise<FeeData> => {
  //   const { data: responseData } = await axios.get<ZrxGasApiResponse>('https://gas.api.0x.org/')
  //   const fees = responseData.result.find((result) => result.source === 'MEDIAN')

  //   if (!fees) throw new TypeError('BTC fee should always exist')

  //   const data = await getErc20Data(to, value, contractAddress)
  //   const feeUnits = await this.provider.getFeeUnits({
  //     from,
  //     to,
  //     value,
  //     data
  //   })

  //   // PAD LIMIT
  //   const gasLimit = new BigNumber(feeUnits).times(2).toString()

  //   return {
  //     fast: {
  //       feeUnits: gasLimit,
  //       feeUnitPrice: String(fees.instant),
  //       networkFee: new BigNumber(fees.instant).times(gasLimit).toPrecision()
  //     },
  //     average: {
  //       feeUnits: gasLimit,
  //       feeUnitPrice: String(fees.fast),
  //       networkFee: new BigNumber(fees.fast).times(gasLimit).toPrecision()
  //     },
  //     slow: {
  //       feeUnits: gasLimit,
  //       feeUnitPrice: String(fees.low),
  //       networkFee: new BigNumber(fees.low).times(gasLimit).toPrecision()
  //     }
  //   }
  // }

  getAddress = async ({ wallet, path }: GetAddressParams): Promise<string> => {
    const addressNList = bip32ToAddressNList(path)
    const btcAddress = await wallet.btcGetAddress({
      addressNList,
      coin: 'bitcoin',
      scriptType: BTCInputScriptType.SpendAddress
    })
    return btcAddress
  }

  // async validateAddress(address: string): Promise<ValidAddressResult> {
  //   const isValidAddress = WAValidator.validate(address, this.getType())
  //   if (isValidAddress) return { valid: true, result: ValidAddressResultType.Valid }
  //   return { valid: false, result: ValidAddressResultType.Invalid }
  // }
}
