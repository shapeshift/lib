/* eslint-disable prettier/prettier */
import {
  bip32ToAddressNList,
  CosmosSignTx,
  CosmosTx,
  CosmosWallet
} from '@shapeshiftoss/hdwallet-core'
import { BIP44Params, chainAdapters, ChainTypes, NetworkTypes } from '@shapeshiftoss/types'
import { ChainAdapter as IChainAdapter } from '../../api'
import { ChainAdapterArgs, CosmosSdkBaseAdapter } from '../CosmosSdkBaseAdapter'
import { toPath } from '../../utils'
import { cosmos } from '@shapeshiftoss/unchained-client'

import { ErrorHandler } from '../../error/ErrorHandler'
import { ChainReference } from '@shapeshiftoss/caip/dist/caip2/caip2'
import BigNumber from 'bignumber.js'

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

  // async getCaip2(): Promise<CAIP2> {
  //   try {
  //     const { data } = await this.chainSpecificProperties.providers.http.getInfo()

  //     switch (data.network) {
  //       case 'mainnet':
  //         return caip2.toCAIP2({
  //           chain: ChainTypes.Cosmos,
  //           network: NetworkTypes.COSMOS_COSMOSHUB_4
  //         })
  //       default:
  //         throw new Error(`CosmosChainAdapter: network is not supported: ${data.network}`)
  //     }
  //   } catch (err) {
  //     return ErrorHandler(err)
  //   }
  // }

  // async getAccount(pubkey: string): Promise<chainAdapters.Account<ChainTypes.Cosmos>> {
  //   try {
  //     const caip = await this.getCaip2()
  //     const { chain, network } = caip2.fromCAIP2(caip)
  //     const { data } = await this.chainSpecificProperties.providers.http.getAccount({ pubkey })

  //     return {
  //       balance: data.balance,
  //       caip2: caip,
  //       caip19: caip19.toCAIP19({ chain, network }),
  //       chain: ChainTypes.Cosmos,
  //       chainSpecific: {
  //         sequence: data.sequence
  //       },
  //       pubkey: data.pubkey
  //     }
  //   } catch (err) {
  //     return ErrorHandler(err)
  //   }
  // }

  // async getTxHistory({
  //   pubkey
  // }: cosmos.api.V1ApiGetTxHistoryRequest): Promise<
  //   chainAdapters.TxHistoryResponse<ChainTypes.Cosmos>
  // > {
  //   try {
  //     const { data } = await this.chainSpecificProperties.providers.http.getTxHistory({ pubkey })

  //     return {
  //       page: data.page,
  //       totalPages: data.totalPages,
  //       transactions: data.transactions.map((tx) => ({
  //         ...tx,
  //         chain: ChainTypes.Cosmos,
  //         network: NetworkTypes.MAINNET,
  //         symbol: 'ATOM'
  //       })),
  //       txs: data.txs
  //     }
  //   } catch (err) {
  //     return ErrorHandler(err)
  //   }
  // }

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

  // async broadcastTransaction(hex: string) {
  //   const { data } = await this.chainSpecificProperties.providers.http.sendTx({ sendTxBody: { hex } })
  //   return data
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

  // async subscribeTxs(
  //   input: chainAdapters.SubscribeTxsInput,
  //   onMessage: (msg: chainAdapters.SubscribeTxsMessage<ChainTypes.Cosmos>) => void,
  //   onError: (err: chainAdapters.SubscribeError) => void
  // ): Promise<void> {
  //   const { wallet, bip44Params = ChainAdapter.defaultBIP44Params } = input

  //   const address = await this.getAddress({ wallet, bip44Params })
  //   const subscriptionId = toRootDerivationPath(bip44Params)

  //   await this.chainSpecificProperties.providers.ws.subscribeTxs(
  //     subscriptionId,
  //     { topic: 'txs', addresses: [address] },
  //     (msg: chainAdapters.SubscribeTxsMessage<ChainTypes.Cosmos>) => {
  //       const transfers = msg.transfers.map<chainAdapters.TxTransfer>((transfer) => ({
  //         caip19: transfer.caip19,
  //         from: transfer.from,
  //         to: transfer.to,
  //         type: transfer.type,
  //         value: transfer.value
  //       }))

  //       onMessage({
  //         address: msg.address,
  //         blockHash: msg.blockHash,
  //         blockHeight: msg.blockHeight,
  //         blockTime: msg.blockTime,
  //         caip2: msg.caip2,
  //         chain: ChainTypes.Cosmos,
  //         confirmations: msg.confirmations,
  //         fee: msg.fee,
  //         status: msg.status,
  //         tradeDetails: msg.tradeDetails,
  //         transfers,
  //         txid: msg.txid
  //       })
  //     },
  //     (err) => onError({ message: err.message })
  //   )
  // }

  // unsubscribeTxs(input?: chainAdapters.SubscribeTxsInput): void {
  //   if (!input) return this.chainSpecificProperties.providers.ws.unsubscribeTxs()

  //   const { bip44Params = ChainAdapter.defaultBIP44Params } = input
  //   const subscriptionId = toRootDerivationPath(bip44Params)

  //   this.chainSpecificProperties.providers.ws.unsubscribeTxs(subscriptionId, { topic: 'txs', addresses: [] })
  // }

  // closeTxs(): void {
  //   this.chainSpecificProperties.providers.ws.close('txs')
  // }
}
