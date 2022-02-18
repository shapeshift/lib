import { CAIP2, caip2, caip19 } from '@shapeshiftoss/caip'
import {
  bip32ToAddressNList,
  CosmosSignedTx,
  CosmosSignTx,
  CosmosWallet
} from '@shapeshiftoss/hdwallet-core'
import { BIP44Params, chainAdapters, ChainTypes, NetworkTypes } from '@shapeshiftoss/types'
import { Transaction } from '@shapeshiftoss/types/dist/chain-adapters'

import { ChainAdapter as IChainAdapter } from '../api'
import { ErrorHandler } from '../error/ErrorHandler'
import { bnOrZero, toPath } from '../utils'

interface CosmosHttpProvider {
  getAccount(pubkey: string): Promise<{
    data: {
      balance: '102848'
      unconfirmedBalance: '0'
      pubkey: 'cosmos1jv3y4mv9kh080m9davaakyrppzckeq9z0rdce4'
      accountNumber: 168003
      sequence: 240
      assets: [
        {
          amount: '37500'
          denom: 'ibc/1FBDD58D438B4D04D26CBFB2E722C18984A0F1A52468C4F42F37D102F3D3F399'
        }
      ]
      delegations: [
        {
          validator: 'cosmosvaloper1ey69r37gfxvxg62sh4r0ktpuc46pzjrm873ae8'
          shares: '4383876.731778557894004734'
          balance: {
            amount: '4383000'
            denom: 'uatom'
          }
        },
        {
          validator: 'cosmosvaloper1lzhlnpahvznwfv4jmay2tgaha5kmz5qxerarrl'
          shares: '71106503.000000000000000000'
          balance: {
            amount: '71106503'
            denom: 'uatom'
          }
        }
      ]
      redelegations: []
      unbondings: []
      rewards: [
        {
          amount: '11.027777609285739022'
          denom: 'uatom'
        }
      ]
    }
    chain: ChainTypes.Cosmos
  }>

  getTxHistory(input: { pubkey: string }): Promise<{
    data: {
      page: number
      totalPages: number
      txs: number
      transactions: Array<Transaction<ChainTypes.Cosmos>>
    }
  }>
}

export interface ChainAdapterArgs {
  providers: {
    http: CosmosHttpProvider
  }
}

export class ChainAdapter implements IChainAdapter<ChainTypes.Cosmos> {
  private readonly providers: {
    http: CosmosHttpProvider
  }
  public static readonly defaultBIP44Params: BIP44Params = {
    purpose: 44,
    coinType: 118,
    accountNumber: 0,
    isChange: false
  }

  constructor(args: ChainAdapterArgs) {
    this.providers = args.providers
  }

  getType(): ChainTypes.Cosmos {
    return ChainTypes.Cosmos
  }

  async getCaip2(): Promise<CAIP2> {
    return 'cosmos:cosmoshub-4'
  }

  async getAccount(pubkey: string): Promise<chainAdapters.Account<ChainTypes.Cosmos>> {
    try {
      const chainId = await this.getCaip2()
      const { chain, network } = caip2.fromCAIP2(chainId)
      const { data } = await this.providers.http.getAccount(pubkey)

      const balance = bnOrZero(data.balance)

      return {
        balance: balance.toString(),
        caip2: chainId,
        caip19: caip19.toCAIP19({ chain, network }),
        chain: ChainTypes.Cosmos,
        pubkey: data.pubkey
      }
    } catch (err) {
      return ErrorHandler(err)
    }
  }

  buildBIP44Params(params: Partial<BIP44Params>): BIP44Params {
    return { ...ChainAdapter.defaultBIP44Params, ...params }
  }

  async getTxHistory(
    input: chainAdapters.TxHistoryInput
  ): Promise<chainAdapters.TxHistoryResponse<ChainTypes.Cosmos>> {
    try {
      const { data } = await this.providers.http.getTxHistory(input)

      return {
        page: data.page,
        totalPages: data.totalPages,
        transactions: data.transactions.map((tx) => ({
          ...tx,
          chain: ChainTypes.Cosmos,
          network: NetworkTypes.COSMOSHUB_MAINNET,
          symbol: 'ATOM'
        })),
        txs: data.txs
      }
    } catch (err) {
      return ErrorHandler(err)
    }
  }

  async buildSendTransaction(tx: chainAdapters.BuildSendTxInput<ChainTypes.Cosmos>): Promise<any> {
    throw new Error('Not Implemented')
  }

  async signTransaction(signTxInput: chainAdapters.SignTxInput<CosmosSignTx>): Promise<string> {
    try {
      const { txToSign, wallet } = signTxInput
      const signedTx = await (wallet as CosmosWallet).cosmosSignTx(txToSign)

      if (!signedTx) throw new Error('Error signing tx')

      return JSON.stringify(signedTx)
    } catch (err) {
      return ErrorHandler(err)
    }
  }

  async signAndBroadcastTransaction(
    signTxInput: chainAdapters.SignTxInput<CosmosSignTx>
  ): Promise<string> {
    throw new Error('Not Implemented')
  }

  async broadcastTransaction(json: string): Promise<string> {
    const signedTx = JSON.parse(json) as CosmosSignedTx
    throw new Error('Not Implemented')
  }

  async getFeeData(
    input: chainAdapters.GetFeeDataInput<ChainTypes.Cosmos>
  ): Promise<chainAdapters.FeeDataEstimate<ChainTypes.Cosmos>> {
    throw new Error('Not Implemented')
  }

  async getAddress(input: chainAdapters.GetAddressInput): Promise<string> {
    const { wallet, bip44Params = ChainAdapter.defaultBIP44Params } = input
    const path = toPath(bip44Params)
    const addressNList = bip32ToAddressNList(path)
    const address = await (wallet as CosmosWallet).cosmosGetAddress({
      addressNList,
      showDisplay: Boolean(input.showOnDevice)
    })
    if (!address) throw new Error('Invalid bip44 path')

    return address
  }

  async validateAddress(address: string): Promise<chainAdapters.ValidAddressResult> {
    throw new Error('Not Implemented')
  }

  async subscribeTxs(
    input: chainAdapters.SubscribeTxsInput,
    onMessage: (msg: chainAdapters.SubscribeTxsMessage<ChainTypes.Cosmos>) => void,
    onError: (err: chainAdapters.SubscribeError) => void
  ): Promise<void> {
    throw new Error('Not Implemented')
  }

  unsubscribeTxs(input?: chainAdapters.SubscribeTxsInput): void {
    throw new Error('Not Implemented')
  }

  closeTxs(): void {
    throw new Error('Not Implemented')
  }
}
