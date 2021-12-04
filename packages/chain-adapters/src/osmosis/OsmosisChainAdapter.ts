import { Contract } from '@ethersproject/contracts'
import { bip32ToAddressNList, ETHSignTx, ETHWallet } from '@shapeshiftoss/hdwallet-core'
import {
  BIP32Params,
  chainAdapters,
  ChainTypes,
  ContractTypes,
  NetworkTypes
} from '@shapeshiftoss/types'
import { osmosis, Token } from '@shapeshiftoss/unchained-client'
import axios from 'axios'
import BigNumber from 'bignumber.js'
import isEmpty from 'lodash/isEmpty'
import WAValidator from 'multicoin-address-validator'
import { numberToHex } from 'web3-utils'

import { ChainAdapter as IChainAdapter } from '../api'
import { ErrorHandler } from '../error/ErrorHandler'
import { toPath, toRootDerivationPath } from '../utils/bip32'

export interface ChainAdapterArgs {
  providers: {
    http: osmosis.api.V1Api
  }
  coinName: string
}


export class ChainAdapter implements IChainAdapter<ChainTypes.Osmosis> {
  private readonly providers: {
    http: osmosis.api.V1Api
  }
  public static readonly defaultBIP32Params: BIP32Params = {
    purpose: 44,
    coinType: 60,
    accountNumber: 0
  }

  constructor(args: ChainAdapterArgs) {
    this.providers = args.providers
  }

  getType(): ChainTypes.Osmosis {
    return ChainTypes.Osmosis
  }

  async getAccount(pubkey: string): Promise<chainAdapters.Account<ChainTypes.Osmosis>> {
    try {
      const { data } = await this.providers.http.getAccount({ pubkey })

      return {
        balance: data.balance,
        chain: ChainTypes.Osmosis,
        // chainSpecific: {
        //   nonce: data.nonce,
        //   tokens: data.tokens.map((token) => ({
        //     balance: token.balance,
        //     contract: token.contract,
        //     // note: unchained gets token types from blockbook
        //     // blockbook only has one definition of a TokenType for osmosis
        //     // https://github1s.com/trezor/blockbook/blob/master/api/types.go#L140
        //     contractType: ContractTypes.ERC20,
        //     name: token.name,
        //     precision: token.decimals,
        //     symbol: token.symbol
        //   }))
        // },
        network: NetworkTypes.MAINNET, // TODO(0xdef1cafe): need to reflect this from the provider
        pubkey: data.pubkey,
        symbol: 'ETH' // TODO(0xdef1cafe): this is real dirty
      }
    } catch (err) {
      return ErrorHandler(err)
    }
  }

  buildBIP32Params(params: Partial<BIP32Params>): BIP32Params {
    return { ...ChainAdapter.defaultBIP32Params, ...params }
  }

  async getTxHistory({
                       pubkey
                     }: osmosis.api.V1ApiGetTxHistoryRequest): Promise<
    chainAdapters.TxHistoryResponse<ChainTypes.Osmosis>
    > {
    try {
      const { data } = await this.providers.http.getTxHistory({ pubkey })

      return {
        page: data.page,
        totalPages: data.totalPages,
        transactions: data.transactions.map((tx) => ({
          ...tx,
          chain: ChainTypes.Osmosis,
          network: NetworkTypes.MAINNET,
          symbol: 'ETH'
        })),
        txs: data.txs
      }
    } catch (err) {
      return ErrorHandler(err)
    }
  }

  // @ts-ignore
  async buildSendTransaction(
    tx: chainAdapters.BuildSendTxInput<ChainTypes.Osmosis>
  ): Promise<{
    txToSign: ETHSignTx
  }> {
    try {
      const {
        to,
        wallet,
        bip32Params = ChainAdapter.defaultBIP32Params,
        // chainSpecific: { erc20ContractAddress, gasPrice, gasLimit },
        sendMax = false
      } = tx

      if (!to) throw new Error('OsmosisChainAdapter: to is required')
      if (!tx?.value) throw new Error('OsmosisChainAdapter: value is required')


      const txToSign: any = {
        // addressNList,
        // value: numberToHex(isErc20Send ? '0' : tx?.value),
        // to: destAddress,
        // chainId: 1, // TODO: implement for multiple chains
        // data,
        // nonce: numberToHex(chainSpecific.nonce),
        // gasPrice: numberToHex(gasPrice),
        // gasLimit: numberToHex(gasLimit)
      }
      return { txToSign }
    } catch (err) {
      return ErrorHandler(err)
    }
  }

  async signTransaction(signTxInput: chainAdapters.SignTxInput<ETHSignTx>): Promise<string> {
    try {
      const { txToSign, wallet } = signTxInput
      const signedTx = await (wallet as ETHWallet).ethSignTx(txToSign)

      if (!signedTx) throw new Error('Error signing tx')

      return signedTx.serialized
    } catch (err) {
      return ErrorHandler(err)
    }
  }

  async signAndBroadcastTransaction(
    signTxInput: chainAdapters.SignTxInput<ETHSignTx>
  ): Promise<string> {
    try {
      const { txToSign, wallet } = signTxInput
      const ethHash = await (wallet as ETHWallet)?.ethSendTx?.(txToSign)

      if (!ethHash) throw new Error('Error signing & broadcasting tx')
      return ethHash.hash
    } catch (err) {
      return ErrorHandler(err)
    }
  }

  async broadcastTransaction(hex: string) {
    const { data } = await this.providers.http.sendTx({ sendTxBody: { hex } })
    return data
  }

  async getFeeData({
                     to,
                     value,
                     // chainSpecific: { contractAddress, from, contractData },
                     sendMax = false
                   }: chainAdapters.GetFeeDataInput<ChainTypes.Osmosis>): Promise<
    chainAdapters.FeeDataEstimate<ChainTypes.Osmosis>
    > {
    const { data: responseData } = await axios.get<chainAdapters.ZrxGasApiResponse>(
      'https://gas.api.0x.org/'
    )
    const fees = responseData.result.find((result) => result.source === 'MEDIAN')

    if (!fees) throw new TypeError('ETH Gas Fees should always exist')

    // const isErc20Send = !!contractAddress
    //
    // // Only care about sendMax for erc20
    // // its hard to estimate eth fees for sendmax to contracts
    // // in MOST cases any eth amount will cost the same 21000 gas
    // if (sendMax && isErc20Send && contractAddress) {
    //   const account = await this.getAccount(from)
    //   const erc20Balance = account?.chainSpecific?.tokens?.find(
    //     (token: { contract: string; balance: string }) =>
    //       token.contract.toLowerCase() === contractAddress.toLowerCase()
    //   )?.balance
    //   if (!erc20Balance) throw new Error('no balance')
    //   value = erc20Balance
    // }
    //
    // const data = contractData ?? (await getErc20Data(to, value, contractAddress))
    //
    // const { data: gasLimit } = await this.providers.http.estimateGas({
    //   from,
    //   to: isErc20Send ? contractAddress : to,
    //   value: isErc20Send ? '0' : value,
    //   data
    // })

    return {
      fast: {
        txFee: new BigNumber(fees.instant).times(1).toPrecision(),
        // chainSpecific: {
        //   gasLimit,
        //   gasPrice: String(fees.instant)
        // }
      },
      average: {
        txFee: new BigNumber(fees.fast).times(1).toPrecision(),
        // chainSpecific: {
        //   gasLimit,
        //   gasPrice: String(fees.fast)
        // }
      },
      slow: {
        txFee: new BigNumber(fees.low).times(1).toPrecision(),
        // chainSpecific: {
        //   gasLimit,
        //   gasPrice: String(fees.low)
        // }
      }
    }
  }

  async getAddress(input: chainAdapters.GetAddressInput): Promise<string> {
    const { wallet, bip32Params = ChainAdapter.defaultBIP32Params } = input
    const path = toPath(bip32Params)
    const addressNList = bip32ToAddressNList(path)
    const ethAddress = await (wallet as ETHWallet).ethGetAddress({
      addressNList,
      showDisplay: Boolean(input.showOnDevice)
    })
    return ethAddress as string
  }

  async validateAddress(address: string): Promise<chainAdapters.ValidAddressResult> {
    const isValidAddress = WAValidator.validate(address, this.getType())
    if (isValidAddress) return { valid: true, result: chainAdapters.ValidAddressResultType.Valid }
    return { valid: false, result: chainAdapters.ValidAddressResultType.Invalid }
  }

  async subscribeTxs(
    input: chainAdapters.SubscribeTxsInput,
    onMessage: (msg: chainAdapters.SubscribeTxsMessage<ChainTypes.Osmosis>) => void,
    onError: (err: chainAdapters.SubscribeError) => void
  ): Promise<void> {
    const { wallet, bip32Params = ChainAdapter.defaultBIP32Params } = input

    const address = await this.getAddress({ wallet, bip32Params })
    const subscriptionId = toRootDerivationPath(bip32Params)

  }

  unsubscribeTxs(input?: chainAdapters.SubscribeTxsInput): void {
    // if (!input) return this.providers.ws.unsubscribeTxs()

    // const { bip32Params = ChainAdapter.defaultBIP32Params } = input
    // const subscriptionId = toRootDerivationPath(bip32Params)

    // this.providers.ws.unsubscribeTxs(subscriptionId, { topic: 'txs', addresses: [] })
  }

  closeTxs(): void {
    // this.providers.ws.close('txs')
  }
}
