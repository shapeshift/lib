/* eslint-disable prettier/prettier */
import { ChainReference } from '@shapeshiftoss/caip/dist/caip2/caip2'
import {
  bip32ToAddressNList,
  CosmosSignTx,
  CosmosTx,
  CosmosWallet
} from '@shapeshiftoss/hdwallet-core'
import { BIP44Params, chainAdapters, ChainTypes } from '@shapeshiftoss/types'
import BigNumber from 'bignumber.js'

import { ChainAdapter as IChainAdapter } from '../../api'
import { ErrorHandler } from '../../error/ErrorHandler'
import { toPath } from '../../utils'
import { ChainAdapterArgs, CosmosSdkBaseAdapter } from '../CosmosSdkBaseAdapter'

// import { cosmos } from '@shapeshiftoss/unchained-client'

export class ChainAdapter extends CosmosSdkBaseAdapter<ChainTypes.Cosmos>
  implements IChainAdapter<ChainTypes.Cosmos> {
  public static readonly defaultBIP44Params: BIP44Params = {
    purpose: 44,
    coinType: 118,
    accountNumber: 0
  }

  constructor(args: ChainAdapterArgs) {
    super()
    this.setChainSpecificProperties(args)
  }

  getType(): ChainTypes.Cosmos {
    return ChainTypes.Cosmos
  }

  async getAddress(input: chainAdapters.GetAddressInput): Promise<string> {
    const { wallet, bip44Params = ChainAdapter.defaultBIP44Params } = input
    const path = toPath(bip44Params)
    const addressNList = bip32ToAddressNList(path)
    const cosmosAddress = await (wallet as CosmosWallet).cosmosGetAddress({
      addressNList,
      showDisplay: Boolean(input.showOnDevice)
    })
    return cosmosAddress as string
  }

  async signTransaction(signTxInput: chainAdapters.SignTxInput<CosmosSignTx>): Promise<string> {
    try {
      const { txToSign, wallet } = signTxInput
      const signedTx = await (wallet as CosmosWallet).cosmosSignTx(txToSign)

      if (!signedTx) throw new Error('Error signing tx')

      // Make generic or union type for signed transactions and return
      return JSON.stringify(signedTx)
    } catch (err) {
      return ErrorHandler(err)
    }
  }

  async buildSendTransaction(
    tx: chainAdapters.BuildSendTxInput<ChainTypes.Cosmos>
  ): Promise<{ txToSign: CosmosSignTx }> {
    try {
      const {
        to,
        wallet,
        bip44Params = CosmosSdkBaseAdapter.defaultBIP44Params,
        chainSpecific: { gas },
        sendMax = false,
        value
      } = tx

      if (!to) throw new Error('CosmosChainAdapter: to is required')
      if (!value) throw new Error('CosmosChainAdapter: value is required')

      const path = toPath(bip44Params)
      const addressNList = bip32ToAddressNList(path)
      const from = await this.getAddress({ bip44Params, wallet })

      if (sendMax) {
        const account = await this.getAccount(from)
        tx.value = new BigNumber(account.balance).minus(gas).toString()
      }

      const utx: CosmosTx = {
        fee: {
          amount: [
            {
              amount: new BigNumber(gas).toString(),
              denom: 'uatom'
            }
          ],
          gas: gas
        },
        msg: [
          {
            type: 'cosmos-sdk/MsgSend',
            value: {
              amount: [
                {
                  amount: new BigNumber(value).toString(),
                  denom: 'uatom'
                }
              ],
              from_address: from,
              to_address: to
            }
          }
        ],
        signatures: [],
        memo: ''
      }

      const txToSign: CosmosSignTx = {
        addressNList,
        tx: utx,
        chain_id: ChainReference.CosmosMainnet,
        account_number: '',
        sequence: ''
      }
      return { txToSign }
    } catch (err) {
      return ErrorHandler(err)
    }
  }

  // async signAndBroadcastTransaction(
  //   signTxInput: chainAdapters.SignTxInput<CosmosSignTx>
  // ): Promise<string> {
  //   try {
  //     const { txToSign, wallet } = signTxInput
  //     const cosmosHash = await (wallet as CosmosWallet)?.cosmosSendTx?.(txToSign)

  //     if (!cosmosHash) throw new Error('Error signing & broadcasting tx')
  //     return cosmosHash.hash
  //   } catch (err) {
  //     return ErrorHandler(err)
  //   }
  // }


  // async getFeeData({
  //   to,
  //   value,
  //   chainSpecific: { contractAddress, from, contractData },
  //   sendMax = false
  // }: chainAdapters.GetFeeDataInput<ChainTypes.Ethereum>): Promise<
  //   chainAdapters.FeeDataEstimate<ChainTypes.Ethereum>
  // > {
  //   const { data: responseData } = await axios.get<chainAdapters.ZrxGasApiResponse>(
  //     'https://gas.api.0x.org/'
  //   )
  //   const fees = responseData.result.find((result) => result.source === 'MEDIAN')

  //   if (!fees) throw new TypeError('ETH Gas Fees should always exist')

  //   const isErc20Send = !!contractAddress

  //   // Only care about sendMax for erc20
  //   // its hard to estimate eth fees for sendmax to contracts
  //   // in MOST cases any eth amount will cost the same 21000 gas
  //   if (sendMax && isErc20Send && contractAddress) {
  //     const account = await this.getAccount(from)
  //     const erc20Balance = account?.chainSpecific?.tokens?.find((token) => {
  //       const { tokenId } = caip19.fromCAIP19(token.caip19)
  //       return tokenId === contractAddress.toLowerCase()
  //     })?.balance
  //     if (!erc20Balance) throw new Error('no balance')
  //     value = erc20Balance
  //   }

  //   const data = contractData ?? (await getErc20Data(to, value, contractAddress))

  //   const { data: gasLimit } = await this.providers.http.estimateGas({
  //     from,
  //     to: isErc20Send ? contractAddress : to,
  //     value: isErc20Send ? '0' : value,
  //     data
  //   })

  //   return {
  //     fast: {
  //       txFee: new BigNumber(fees.instant).times(gasLimit).toPrecision(),
  //       chainSpecific: {
  //         gasLimit,
  //         gasPrice: String(fees.instant)
  //       }
  //     },
  //     average: {
  //       txFee: new BigNumber(fees.fast).times(gasLimit).toPrecision(),
  //       chainSpecific: {
  //         gasLimit,
  //         gasPrice: String(fees.fast)
  //       }
  //     },
  //     slow: {
  //       txFee: new BigNumber(fees.low).times(gasLimit).toPrecision(),
  //       chainSpecific: {
  //         gasLimit,
  //         gasPrice: String(fees.low)
  //       }
  //     }
  //   }
  // }


}
