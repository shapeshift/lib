// @ts-ignore
import { toCAIP19 } from '@shapeshiftoss/caip'
// @ts-ignore
import {
  ChainAdapterManager,
  // @ts-ignore
  CosmosChainAdapter,
  // @ts-ignore
  OsmosisChainAdapter
  // @ts-ignore
} from '@shapeshiftoss/chain-adapters/*'
import {
  bip32ToAddressNList,
  CosmosWallet,
  HDWallet,
  OsmosisWallet
} from '@shapeshiftoss/hdwallet-core'
import {
  ApprovalNeededOutput,
  Asset,
  // BuildQuoteTxInput,
  ChainTypes,
  // ExecQuoteInput,
  ExecQuoteOutput,
  // GetQuoteInput,
  MinMaxOutput,
  // Quote,
  SwapperType
  // @ts-ignore
} from '@shapeshiftoss/types'
import axios from 'axios'

// import { getRate } from '../../api'
import {
  BuildTradeInput,
  BuyAssetBySellIdInput,
  CommonTradeInput,
  ExecuteTradeInput,
  Swapper,
  Trade,
  TradeQuote
} from '../../api'
import { DEFAULT_SOURCE } from './constants'
import { getRateInfo, IsymbolDenomMapping, symbolDenomMapping } from './OsmoService'

const osmoUrl = 'https://lcd-osmosis.keplr.app'

const getMin = async function () {
  return {
    minimum: '0',
    maximum: '1000'
  }
}

export type OsmoSwapperDeps = {
  wallet: HDWallet
  adapterManager: ChainAdapterManager
}

/**
 * Playground for testing different scenarios of multiple swappers in the manager.
 * Meant for local testing only
 */
export class OsmoSwapper implements Swapper {
  supportAssets: string[]
  deps: OsmoSwapperDeps

  getType() {
    // @ts-ignore
    return SwapperType.Osmosis
  }

  constructor(deps: OsmoSwapperDeps) {
    this.deps = deps
    this.supportAssets = ['cosmos:cosmoshub-4/slip44:118', 'cosmos:osmosis-1/slip44:118']
  }

  // @ts-ignore
  async getTradeQuote(input: CommonTradeInput): Promise<TradeQuote<ChainTypes>> {
    const { sellAsset, buyAsset, sellAmount } = input

    if (!sellAmount) {
      throw new Error('sellAmount is required')
    }

    const { rate, buyAmount } = await getRateInfo(
      sellAsset,
      buyAsset,
      sellAmount !== '0' ? sellAmount : '1'
    )
    // console.log('******: ', { rate, priceImpact, tradeFee, buyAmount })

    // @ts-ignore
    return {
      buyAsset,
      feeData: { fee: '100' },
      maximum: '100',
      minimum: '10000',
      sellAssetAccountId: '0',
      rate,
      sellAsset,
      success: true,
      sellAmount,
      buyAmount,
      sources: DEFAULT_SOURCE
    }
  }

  // @ts-ignore
  async buildTrade(args: BuildTradeInput): Promise<Trade<ChainTypes>> {
    const { sellAsset, buyAsset, sellAmount } = args

    if (!sellAmount) {
      throw new Error('sellAmount is required')
    }

    const { rate, buyAmount } = await getRateInfo(
      sellAsset,
      buyAsset,
      sellAmount !== '0' ? sellAmount : '1'
    )

    // @ts-ignore
    return {
      buyAmount,
      buyAsset,
      depositAddress: '',
      feeData: { fee: '100' },
      rate,
      receiveAddress: '',
      sellAmount: '',
      sellAsset,
      sellAssetAccountId: '0',
      sources: [{ name: 'Osmosis', proportion: '100' }],
      success: true
    }
  }

  // @ts-ignore
  async executeTrade(args: ExecuteTradeInput<ChainTypes>): Promise<ExecQuoteOutput> {
    console.info('args: ', args)
    // const {
    //   // @ts-ignore
    //   quote: { sellAsset, buyAsset, sellAmount }
    // } = args.quote
    const sellAsset = args.trade.sellAsset
    const buyAsset = args.trade.buyAsset
    const sellAmount = args.trade.sellAmount
    const wallet = args.wallet
    if (!sellAsset) throw Error('missing sellAsset')
    if (!buyAsset) throw Error('missing buyAsset')
    if (!sellAmount) throw Error('missing sellAmount')
    if (!wallet) throw Error('missing wallet')

    const sellAssetDenom = symbolDenomMapping[sellAsset.symbol as keyof IsymbolDenomMapping]
    const buyAssetDenom = symbolDenomMapping[buyAsset.symbol as keyof IsymbolDenomMapping]

    const fee = '100'
    const gas = '1350000'

    console.info('sellAsset.chain: ', sellAsset.chain)
    console.info('deps: ', this.deps)
    const osmosisAdapter = this.deps.adapterManager.byChain(sellAsset.chain) as OsmosisChainAdapter
    console.info('osmosisAdapter: ', osmosisAdapter)

    // const osmosisAdapter = this.adapterManager.byNetwork(sellAsset.network) as OsmosisChainAdapter

    console.info('args: ', args)
    console.info('wallet: ', wallet)
    const sellAddress = await (wallet as OsmosisWallet).osmosisGetAddress({
      addressNList: bip32ToAddressNList("m/44'/118'/0'/0/0")
    })
    const buyAddress = await (wallet as CosmosWallet).cosmosGetAddress({
      addressNList: bip32ToAddressNList("m/44'/118'/0'/0/0")
    })

    //TODO verify input balance
    //get IBC balance
    //if ibc balance low
    //then do ibc deposit FIRST
    //wait

    if (!sellAddress) throw new Error('no sell address')
    if (!buyAddress) throw new Error('no buy address')
    console.info('sellAddress: ', sellAddress)
    console.info('buyAddress: ', buyAddress)

    const accountUrl = `${osmoUrl}/auth/accounts/${sellAddress}`
    console.info('accountUrl: ', accountUrl)
    const responseAccount = await axios.get(accountUrl)
    console.info('responseAccount: ', responseAccount.data)
    const accountNumber = responseAccount.data.result.value.account_number || 0
    const sequence = responseAccount.data.result.value.sequence || 0
    console.info('accountNumber: ', accountNumber)
    console.info('sequence: ', sequence)

    const osmoAddressNList = bip32ToAddressNList("m/44'/118'/0'/0/0")

    const tx1 = {
      memo: '',
      fee: {
        amount: [
          {
            amount: fee.toString(),
            denom: 'uosmo'
          }
        ],
        gas: gas.toString()
      },
      signatures: null,
      msg: [
        {
          type: 'osmosis/gamm/swap-exact-amount-in',
          value: {
            sender: sellAddress,
            routes: [
              {
                poolId: '1', // TODO should probably get this from the util pool call
                tokenOutDenom: buyAssetDenom
              }
            ],
            tokenIn: {
              denom: sellAssetDenom,
              amount: sellAmount
            },
            tokenOutMinAmount: '1' // TODO slippage tolerance
          }
        }
      ]
    }

    const signTxInput = {
      txToSign: {
        tx: tx1,
        addressNList: osmoAddressNList,
        chain_id: 'osmosis-1',
        account_number: accountNumber,
        sequence
      },
      wallet
    }
    console.info('signTxInput: ', signTxInput)
    console.info('signTxInput: ', JSON.stringify(signTxInput))

    const signed = await osmosisAdapter.signTransaction(signTxInput)
    console.info('signed: ', signed)

    //if broadcast
    const payload = {
      tx_bytes: signed,
      mode: 'BROADCAST_MODE_SYNC'
    }
    const urlRemote = osmoUrl + '/cosmos/tx/v1beta1/txs'
    let txid1 = await axios({
      url: urlRemote,
      method: 'POST',
      data: payload
    })
    txid1 = txid1.data
    console.info('txid1: ', txid1)

    // const signed = await osmosisAdapter.signAndBroadcastTransaction(signTxInput)
    // console.info('signed: ', signed)

    // const broadcastTxInput = { tx: signed, symbol: 'OSMO', amount: '0', network: 'OSMO' }
    //
    // const txid1 = await osmosisAdapter.broadcastTransaction(broadcastTxInput)

    // osmoToAtomCallback(
    //   txid1,
    //   sellAddress,
    //   gas,
    //   buyAssetDenom,
    //   buyAddress,
    //   wallet,
    //   accountUrl,
    //   osmosisAdapter,
    //   osmoAddressNList
    // )
    // @ts-ignore
    return { txid: txid1 }
  }

  // async buildQuoteTx(input: BuildQuoteTxInput): Promise<Quote<ChainTypes>> {
  //   const {
  //     sellAsset,
  //     buyAsset,
  //     sellAmount,
  //     sellAssetAccountId,
  //     buyAssetAccountId
  //     // slippage = DEFAULT_SLIPPAGE_TOLERANCE,
  //   } = input.input
  //
  //   if (!sellAmount) throw new Error('OsmosisSwapper:buildQuoteTx sellAmount is required')
  //
  //   const { buyAmount } = await getRateInfo(sellAsset, buyAsset, sellAmount)
  //   // console.log('resp: ', { tradeFee, buyAmount })
  //
  //   return {
  //     success: true,
  //     sellAsset,
  //     buyAsset,
  //     depositAddress: '',
  //     // feeData: { fee: '100', receiveNetworkFee: tradeFee },
  //     sellAmount,
  //     buyAmount,
  //     sources: DEFAULT_SOURCE,
  //     sellAssetAccountId,
  //     buyAssetAccountId
  //   }
  // }

  getUsdRate(input: Pick<Asset, 'symbol' | 'tokenId'>): Promise<string> {
    console.info(input)
    throw new Error('OsmoSwapper: getUsdRate unimplemented')
  }

  getMinMax(input: any): Promise<MinMaxOutput> {
    console.info(input)
    return getMin()
  }

  // async executeQuote(args: ExecQuoteInput<ChainTypes>): Promise<ExecQuoteOutput> {
  //   console.info('args: ', args)
  //   // const {
  //   //   // @ts-ignore
  //   //   quote: { sellAsset, buyAsset, sellAmount }
  //   // } = args.quote
  //   const sellAsset = args.quote.sellAsset
  //   const buyAsset = args.quote.buyAsset
  //   const sellAmount = args.quote.sellAmount
  //   const wallet = args.wallet
  //
  //   const sellAssetDenom = symbolDenomMapping[sellAsset.symbol as keyof IsymbolDenomMapping]
  //   const buyAssetDenom = symbolDenomMapping[buyAsset.symbol as keyof IsymbolDenomMapping]
  //
  //   const fee = '100'
  //   const gas = '1350000'
  //
  //   console.info('sellAsset.chain: ', sellAsset.chain)
  //   console.info('deps: ', this.deps)
  //   const osmosisAdapter = this.deps.adapterManager.byChain(sellAsset.chain) as OsmosisChainAdapter
  //   console.info('osmosisAdapter: ', osmosisAdapter)
  //
  //   // const osmosisAdapter = this.adapterManager.byNetwork(sellAsset.network) as OsmosisChainAdapter
  //
  //   console.info('args: ', args)
  //   console.info('wallet: ', wallet)
  //   const sellAddress = await (wallet as OsmosisWallet).osmosisGetAddress({
  //     addressNList: bip32ToAddressNList("m/44'/118'/0'/0/0")
  //   })
  //   const buyAddress = await (wallet as CosmosWallet).cosmosGetAddress({
  //     addressNList: bip32ToAddressNList("m/44'/118'/0'/0/0")
  //   })
  //
  //   //TODO verify input balance
  //
  //   //if ibc balance low
  //   //then do ibc deposit FIRST
  //   //wait
  //
  //   if (!sellAddress) throw new Error('no sell address')
  //   if (!buyAddress) throw new Error('no buy address')
  //   console.info('sellAddress: ', sellAddress)
  //   console.info('buyAddress: ', buyAddress)
  //
  //   const accountUrl = `${osmoUrl}/auth/accounts/${sellAddress}`
  //   console.info('accountUrl: ', accountUrl)
  //   const responseAccount = await axios.get(accountUrl)
  //   console.info('responseAccount: ', responseAccount.data)
  //   const accountNumber = responseAccount.data.result.value.account_number || 0
  //   const sequence = responseAccount.data.result.value.sequence || 0
  //   console.info('accountNumber: ', accountNumber)
  //   console.info('sequence: ', sequence)
  //
  //   const osmoAddressNList = bip32ToAddressNList("m/44'/118'/0'/0/0")
  //
  //   const tx1 = {
  //     memo: '',
  //     fee: {
  //       amount: [
  //         {
  //           amount: fee.toString(),
  //           denom: 'uosmo'
  //         }
  //       ],
  //       gas: gas.toString()
  //     },
  //     signatures: null,
  //     msg: [
  //       {
  //         type: 'osmosis/gamm/swap-exact-amount-in',
  //         value: {
  //           sender: sellAddress,
  //           routes: [
  //             {
  //               poolId: '1', // TODO should probably get this from the util pool call
  //               tokenOutDenom: buyAssetDenom
  //             }
  //           ],
  //           tokenIn: {
  //             denom: sellAssetDenom,
  //             amount: sellAmount
  //           },
  //           tokenOutMinAmount: '1' // TODO slippage tolerance
  //         }
  //       }
  //     ]
  //   }
  //
  //   const signTxInput = {
  //     txToSign: {
  //       tx: tx1,
  //       addressNList: osmoAddressNList,
  //       chain_id: 'osmosis-1',
  //       account_number: accountNumber,
  //       sequence
  //     },
  //     wallet
  //   }
  //   console.info('signTxInput: ', signTxInput)
  //   console.info('signTxInput: ', JSON.stringify(signTxInput))
  //
  //   const signed = await osmosisAdapter.signTransaction(signTxInput)
  //   console.info('signed: ', signed)
  //
  //   //if broadcast
  //   const payload = {
  //     tx_bytes: signed,
  //     mode: 'BROADCAST_MODE_SYNC'
  //   }
  //   const urlRemote = osmoUrl + '/cosmos/tx/v1beta1/txs'
  //   let txid1 = await axios({
  //     url: urlRemote,
  //     method: 'POST',
  //     data: payload
  //   })
  //   txid1 = txid1.data
  //   console.info('txid1: ', txid1)
  //
  //   // const signed = await osmosisAdapter.signAndBroadcastTransaction(signTxInput)
  //   // console.info('signed: ', signed)
  //
  //   // const broadcastTxInput = { tx: signed, symbol: 'OSMO', amount: '0', network: 'OSMO' }
  //   //
  //   // const txid1 = await osmosisAdapter.broadcastTransaction(broadcastTxInput)
  //
  //   // osmoToAtomCallback(
  //   //   txid1,
  //   //   sellAddress,
  //   //   gas,
  //   //   buyAssetDenom,
  //   //   buyAddress,
  //   //   wallet,
  //   //   accountUrl,
  //   //   osmosisAdapter,
  //   //   osmoAddressNList
  //   // )
  //   // @ts-ignore
  //   return { txid: txid1 }
  // }

  // async executeOsmoToAtomQuote(
  //   input: ExecQuoteInput,
  //   wallet: any
  // ): Promise<ExecQuoteOutput | undefined> {
  //   const {
  //     quote: { sellAsset, buyAsset, sellAmount }
  //   } = input
  //
  //   const sellAssetDenom = symbolDenomMapping[sellAsset.symbol as keyof IsymbolDenomMapping]
  //   const buyAssetDenom = symbolDenomMapping[buyAsset.symbol as keyof IsymbolDenomMapping]
  //
  //   const fee = '100'
  //   const gas = '1350000'
  //
  //   const osmosisAdapter = this.adapterManager.byNetwork(sellAsset.network) as OsmosisChainAdapter
  //
  //   const sellAddress = await (wallet as OsmosisWallet).osmosisGetAddress({
  //     addressNList: bip32ToAddressNList("m/44'/118'/0'/0/0")
  //   })
  //   const buyAddress = await (wallet as CosmosWallet).cosmosGetAddress({
  //     addressNList: bip32ToAddressNList("m/44'/118'/0'/0/0")
  //   })
  //
  //   if (!sellAddress) throw new SwapError('no sell address')
  //   if (!buyAddress) throw new SwapError('no buy address')
  //
  //   const accountUrl = `${osmoUrl}/auth/accounts/${sellAddress}`
  //   const responseAccount = await axios.get(accountUrl)
  //   const accountNumber = responseAccount.data.result.value.account_number
  //   const sequence = responseAccount.data.result.value.sequence
  //
  //   const osmoAddressNList = bip32ToAddressNList("m/44'/118'/0'/0/0")
  //
  //   const tx1 = {
  //     memo: '',
  //     fee: {
  //       amount: [
  //         {
  //           amount: fee.toString(),
  //           denom: 'uosmo'
  //         }
  //       ],
  //       gas: gas.toString()
  //     },
  //     signatures: null,
  //     msg: [
  //       {
  //         type: 'osmosis/gamm/swap-exact-amount-in',
  //         value: {
  //           sender: sellAddress,
  //           routes: [
  //             {
  //               poolId: '1', // TODO should probably get this from the util pool call
  //               tokenOutDenom: buyAssetDenom
  //             }
  //           ],
  //           tokenIn: {
  //             denom: sellAssetDenom,
  //             amount: sellAmount
  //           },
  //           tokenOutMinAmount: '1' // TODO slippage tolerance
  //         }
  //       }
  //     ]
  //   }
  //
  //   const signed = await osmosisAdapter.signTransaction(
  //     {
  //       symbol: 'OSMO',
  //       transaction: {
  //         tx: tx1,
  //         addressNList: osmoAddressNList,
  //         chain_id: 'osmosis-1',
  //         account_number: accountNumber,
  //         sequence
  //       }
  //     },
  //     wallet as any
  //   )
  //
  //   const broadcastTxInput = { tx: signed, symbol: 'OSMO', amount: '0', network: 'OSMO' }
  //
  //   const txid1 = await osmosisAdapter.broadcastTransaction(broadcastTxInput)
  //
  //   // osmoToAtomCallback(txid1, sellAddress, gas, buyAssetDenom, buyAddress, wallet, accountUrl, osmosisAdapter, osmoAddressNList)
  //   //
  //   return { txid: txid1 }
  // }

  // async executeAtomToOsmoQuote(
  //     input: ExecQuoteInput,
  //     wallet: HDWallet
  // ): Promise<ExecQuoteOutput | undefined> {
  //   const {
  //     quote: { sellAsset, buyAsset, sellAmount }
  //   } = input
  //   const sellAssetDenom = symbolDenomMapping[sellAsset.symbol as keyof IsymbolDenomMapping]
  //   const buyAssetDenom = symbolDenomMapping[buyAsset.symbol as keyof IsymbolDenomMapping]
  //
  //   const fee = '100'
  //   const gas = '1350000'
  //
  //   const osmoAdapter = this.adapterManager.byNetwork(buyAsset.network) as OsmosisChainAdapter
  //   const atomAdapter = this.adapterManager.byNetwork(sellAsset.network) as CosmosChainAdapter
  //
  //   const atomAddressNList = bip32ToAddressNList("m/44'/118'/0'/0/0")
  //   const osmoAddressNList = bip32ToAddressNList("m/44'/118'/0'/0/0")
  //
  //   const atomAddress = await (wallet as CosmosWallet).cosmosGetAddress({
  //     addressNList: bip32ToAddressNList("m/44'/118'/0'/0/0")
  //   })
  //
  //   const atomAccountUrl = `${atomUrl}/auth/accounts/${atomAddress}`
  //   const atomResponseAccount = await axios.get(atomAccountUrl)
  //   const atomAccountNumber = atomResponseAccount.data.result.value.account_number
  //   const atomSequence = atomResponseAccount.data.result.value.sequence
  //
  //   if(!atomAccountNumber) throw new SwapError('no atom account number')
  //   if(!atomSequence) throw new SwapError('no atom sequence')
  //
  //   const osmoResponseLatestBlock = await axios.get(`${osmoUrl}/blocks/latest`)
  //   const osmoLatestBlock = osmoResponseLatestBlock.data.block.header.height
  //
  //   const buyAddress = await (wallet as OsmosisWallet).osmosisGetAddress({
  //     addressNList: bip32ToAddressNList("m/44'/118'/0'/0/0")
  //   })
  //
  //   const sellAddress = await (wallet as CosmosWallet).cosmosGetAddress({
  //     addressNList: bip32ToAddressNList("m/44'/118'/0'/0/0")
  //   })
  //
  //   if(!sellAddress) throw new SwapError('no sell address')
  //   if(!buyAddress) throw new SwapError('no buy address')
  //
  //   const tx1 = {
  //     memo: '',
  //     fee: {
  //       amount: [
  //         {
  //           amount: '0', // having a fee here causes error
  //           denom: 'uosmo'
  //         }
  //       ],
  //       gas: gas.toString()
  //     },
  //     signatures: null,
  //     msg: [
  //       {
  //         type: 'cosmos-sdk/MsgTransfer',
  //         value: {
  //           source_port: 'transfer',
  //           source_channel: 'channel-141',
  //           token: {
  //             denom: 'uatom',
  //             amount: sellAmount
  //           },
  //           sender: sellAddress,
  //           receiver: buyAddress,
  //           timeout_height: {
  //             revision_number: '4',
  //             revision_height: String(Number(osmoLatestBlock)+100)
  //           }
  //         }
  //       }
  //     ]
  //   }
  //
  //   const signed = await atomAdapter.signTransaction(
  //       {
  //         symbol: 'ATOM',
  //         transaction: {
  //           tx: tx1,
  //           addressNList: atomAddressNList,
  //           chain_id: 'cosmoshub-4',
  //           account_number: atomAccountNumber,
  //           sequence: atomSequence
  //         }
  //       },
  //       wallet as CosmosWallet
  //   )
  //
  //   const broadcastTxInput = { tx: signed, symbol: 'OSMO', amount: '0', network: 'OSMO' }
  //   const txid1 = await atomAdapter.broadcastTransaction(broadcastTxInput)
  //
  //   atomToOsmoCallback(txid1, buyAddress, fee, gas, buyAssetDenom, sellAssetDenom, osmoAdapter, osmoAddressNList, wallet)
  //
  //   return { txid: txid1 }
  //
  // }

  // getDefaultPair(): [CAIP19, CAIP19] {
  //   throw new Error('OsmoSwapper: getDefaultPair unimplemented')
  // }

  async approvalNeeded(): Promise<ApprovalNeededOutput> {
    const result = { approvalNeeded: false }
    return result
  }

  async approveInfinite(): Promise<string> {
    throw new Error('OsmoSwapper: approveInfinite unimplemented')
  }

  filterBuyAssetsBySellAssetId(args: BuyAssetBySellIdInput): any[] {
    const { sellAssetId } = args
    if (!this.supportAssets.includes(sellAssetId)) return []
    return this.supportAssets
  }

  filterAssetIdsBySellable(): any[] {
    return this.supportAssets
  }
}
