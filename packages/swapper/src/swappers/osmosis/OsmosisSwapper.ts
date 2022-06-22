import { AssetId, ChainId, osmosisChainId, cosmosChainId } from '@shapeshiftoss/caip'
import { bip32ToAddressNList, CosmosWallet, HDWallet, OsmosisWallet } from '@shapeshiftoss/hdwallet-core'
import {
  Asset,
  SwapperType
} from '@shapeshiftoss/types'
import {
  osmosis,
  cosmos
} from '@shapeshiftoss/chain-adapters'

import {
  BuyAssetBySellIdInput, CommonTradeInput, Swapper, ApprovalNeededOutput,
  GetMinMaxInput,
  MinMaxOutput,
  TradeResult,
  TradeTxs,
  BuildTradeInput,
  SwapErrorTypes,
  SwapError,
} from '../../api'
import { atomUrl, getAtomChannelBalance, getRateInfo, IsymbolDenomMapping, osmoUrl, pollForAtomChannelBalance, pollForComplete, symbolDenomMapping } from './utils/helpers'
import { DEFAULT_SOURCE, MAX_SWAPPER_SELL } from './utils/constants'
import axios from 'axios'
import { bn, bnOrZero } from '../utils/bignumber'

export type OsmoSwapperDeps = {
  wallet: HDWallet
  adapterManager: any // TODO: Fix
}

const fee = '10000'
export class OsmosisSwapper implements Swapper<ChainId> {
  supportAssets: string[]
  deps: OsmoSwapperDeps

  getType() {
    return SwapperType.Osmosis
  }

  constructor(deps: OsmoSwapperDeps) {
    this.deps = deps
    this.supportAssets = ['cosmos:cosmoshub-4/slip44:118', 'cosmos:osmosis-1/slip44:118']

  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async initialize() {
  }

  async getTradeTxs(tradeResult: TradeResult): Promise<TradeTxs> {
    console.log("tradeResult", tradeResult)
    return {
      sellTxid: tradeResult.tradeId,
      buyTxid: tradeResult.tradeId
    }
  }

  async getUsdRate(input: Pick<Asset, 'symbol' | 'assetId'>): Promise<string> {
    const { symbol } = input
    const sellAssetSymbol = symbol
    const buyAssetSymbol = 'USDC'
    const sellAmount = '1'
    const { rate } = await getRateInfo(
      sellAssetSymbol,
      buyAssetSymbol,
      sellAmount)
    console.log('buyAssetSymbol', buyAssetSymbol)
    console.log('sellAssetSymbol', sellAssetSymbol)
    console.log('rate', rate)
    return rate
  }

  async getMinMax(input: GetMinMaxInput): Promise<MinMaxOutput> {
    const { sellAsset } = input
    const usdRate = await this.getUsdRate({ ...sellAsset })
    const minimum = bn(1).dividedBy(bnOrZero(usdRate)).toString()
    const maximum = MAX_SWAPPER_SELL

    return {
      minimum,
      maximum
    }
  }

  async approvalNeeded(): Promise<ApprovalNeededOutput> {
    return { approvalNeeded: false }
  }

  async approveInfinite(): Promise<string> {
    throw new Error('OsmosisSwapper: approveInfinite unimplemented')
  }

  filterBuyAssetsBySellAssetId(args: BuyAssetBySellIdInput): any[] {
    const { sellAssetId } = args
    if (!this.supportAssets.includes(sellAssetId)) return []
    return this.supportAssets
  }

  filterAssetIdsBySellable(): AssetId[] {
    return this.supportAssets
  }

  // TODO: clean up
  async performIbcTransfer(input: any, adapter: any, wallet: any, accountBaseUrl: string, blockBaseUrl: string, denom: string, sourceChannel: string, fee: string): Promise<any> {
    let { sender, receiver, amount } = input
    console.info('performIbcTransfer input: ', input)

    const gas = '1350000'

    //get block height
    const responseLatestBlock = await axios.get(`${blockBaseUrl}/blocks/latest`)
    const latestBlock = responseLatestBlock.data.block.header.height
    console.info('atomLatestBlock: ', latestBlock)

    const addressNList = bip32ToAddressNList("m/44'/118'/0'/0/0")

    const accountUrl = `${accountBaseUrl}/auth/accounts/${sender}`
    const responseAccount = await axios.get(accountUrl)
    console.info('responseAccount: ', responseAccount)
    const accountNumber = responseAccount.data.result.value.account_number
    const sequence = responseAccount.data.result.value.sequence
    console.info('accountNumber: ', accountNumber)
    console.info('sequence: ', sequence)
    console.info('denom: ', denom)
    console.info('sourceChannel: ', sourceChannel)
    console.info('amount: ', amount)


    if (!accountNumber) throw new Error('no atom account number')

    const tx1 = {
      memo: '',
      fee: {
        amount: [
          {
            amount: fee.toString(), // having a fee here causes error
            denom: 'uosmo'
          }
        ],
        gas: gas.toString()
      },
      signatures: null,
      msg: [
        {
          type: 'cosmos-sdk/MsgTransfer',
          value: {
            source_port: 'transfer',
            source_channel: sourceChannel,
            token: {
              denom,
              amount
            },
            sender,
            receiver,
            timeout_height: {
              revision_number: '4',
              revision_height: String(Number(latestBlock) + 100)
            }
          }
        }
      ]
    }

    console.info('adapter: ', adapter)
    const signed = await adapter.signTransaction({
      txToSign: {
        tx: tx1,
        addressNList,
        chain_id: 'osmosis-1',
        account_number: accountNumber,
        sequence: sequence
      },
      wallet: wallet as any
    })
    console.info('signed:', signed)

    const txid1 = await adapter.broadcastTransaction(signed)
    console.info('txid1: ', txid1)

    return {
      txid: txid1
    }
  }

  async buildTrade(args: BuildTradeInput): Promise<any> {
    const { sellAsset, buyAsset, sellAmount } = args

    if (!sellAmount) {
      throw new Error('sellAmount is required')
    }

    const { rate, buyAmount } = await getRateInfo(
      sellAsset.symbol,
      buyAsset.symbol,
      sellAmount !== '0' ? sellAmount : '1'
    )

    //convert amount to base
    let amountBaseSell: number = parseFloat(sellAmount)
    amountBaseSell = parseInt(String(amountBaseSell))
    const amountBaseSellString = amountBaseSell.toString()
    // @ts-ignore
    return {
      buyAmount,
      buyAsset,
      depositAddress: '',
      feeData: { fee },
      rate,
      receiveAddress: '',
      sellAmount: amountBaseSellString,
      sellAsset,
      sellAssetAccountId: '0',
      sources: [{ name: 'Osmosis', proportion: '100' }],
      success: true
    }
  }

  async getTradeQuote(input: CommonTradeInput): Promise<any> {
    const { sellAsset, buyAsset, sellAmount } = input
    if (!sellAmount) {
      throw new Error('sellAmount is required')
    }
    console.log('sellAmount', sellAmount)
    const { rate, buyAmount } = await getRateInfo(
      sellAsset.symbol,
      buyAsset.symbol,
      sellAmount !== '0' ? sellAmount : '1'
    )

    const { minimum, maximum } = await this.getMinMax(input)
    console.log('getTraceQuote rate', buyAmount.toString())
    console.log('getTraceQuote buyAmount', buyAmount.toString())
    return {
      buyAsset,
      feeData: { fee },
      maximum,
      minimum,
      sellAssetAccountId: '0',
      rate,
      sellAsset,
      success: true,
      sellAmount,
      buyAmount,
      sources: DEFAULT_SOURCE
    }
  }

  async executeTrade(args: any): Promise<TradeResult> {
    const sellAsset = args.trade.sellAsset
    const buyAsset = args.trade.buyAsset
    let sellAmount = args.trade.sellAmount
    const buyAmount = args.trade.buyAmount
    const wallet = args.wallet

    if (!sellAsset) throw Error('missing sellAsset')
    if (!buyAsset) throw Error('missing buyAsset')
    if (!sellAmount) throw Error('missing sellAmount')
    if (!buyAmount) throw Error('missing buyAmount')
    if (!wallet) throw Error('missing wallet')

    const pair = sellAsset.symbol + '_' + buyAsset.symbol
    const sellAssetDenom = symbolDenomMapping[sellAsset.symbol as keyof IsymbolDenomMapping]
    const buyAssetDenom = symbolDenomMapping[buyAsset.symbol as keyof IsymbolDenomMapping]

    const gas = '1350000'

    const osmosisAdapter = this.deps.adapterManager.get(osmosisChainId) as | osmosis.ChainAdapter
      | undefined
    const cosmosAdapter = this.deps.adapterManager.get(cosmosChainId) as | cosmos.ChainAdapter
      | undefined

    const osmoAddress = await (wallet as OsmosisWallet).osmosisGetAddress({
      addressNList: bip32ToAddressNList("m/44'/118'/0'/0/0")
    })
    const atomAddress = await (wallet as CosmosWallet).cosmosGetAddress({
      addressNList: bip32ToAddressNList("m/44'/118'/0'/0/0")
    })

    if (!osmoAddress) throw Error("Failed to get osmoAddress!")
    if (!atomAddress) throw Error("Failed to get atomAddress!")

    let sellAddress
    let buyAddress

    if (pair === 'ATOM_OSMO') {
      console.log('atom trade')
      //TODO verify input balance
      console.info('osmoAddress: ', osmoAddress)
      let atomChannelBalance = await getAtomChannelBalance(osmoAddress)
      console.info('atomChannelBalance: ', atomChannelBalance)

      sellAddress = atomAddress
      buyAddress = osmoAddress

      const transfer = {
        sender: sellAddress,
        receiver: buyAddress,
        amount: String(sellAmount)
      }

      const {txid} = await this.performIbcTransfer(transfer, cosmosAdapter, wallet, atomUrl, osmoUrl, 'uatom', 'channel-141', '0')
      //wait till confirmed
      console.info('txid: ', txid)
      const pollResult = await pollForComplete(txid, atomUrl)
      if (pollResult !== 'success')
        throw new Error('ibc transfer failed')

      sellAmount = await pollForAtomChannelBalance(buyAddress)

    } else if (pair === 'OSMO_ATOM') {
      sellAddress = osmoAddress
      buyAddress = atomAddress
    } else {
      throw Error("Pair not supported! " + pair)
    }

    if (!sellAddress) throw new Error('no sell address')
    if (!buyAddress) throw new Error('no buy address')

    let sender = osmoAddress
    const accountUrl = `${osmoUrl}/auth/accounts/${sender}`
    const responseAccount = await axios.get(accountUrl)
    const accountNumber = responseAccount.data.result.value.account_number || 0
    const sequence = responseAccount.data.result.value.sequence || 0
    const osmoAddressNList = bip32ToAddressNList("m/44'/118'/0'/0/0")
    console.log('first sequence: ', sequence)


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
            sender,
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

    // @ts-ignore
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

    if (osmosisAdapter) {
      console.info('signTxInput: ', JSON.stringify(signTxInput))
      const signed = await osmosisAdapter.signTransaction(signTxInput)
      console.info('signed: ', signed)
      const txid1 = await osmosisAdapter.broadcastTransaction(signed)
      console.info('txid1: ', txid1)

      if (pair === 'OSMO_ATOM') {
        const pollResult = await pollForComplete(txid1, osmoUrl)
        console.log('pollResult', pollResult)
        if (pollResult !== 'success')
          throw new Error('osmo swap failed')

        const amount = await pollForAtomChannelBalance(sender)
        //perform IBC deposit
        const transfer = {
          sender: sellAddress,
          receiver: buyAddress,
          amount: String(amount)
        }

        const txid = await this.performIbcTransfer(transfer, osmosisAdapter, wallet, osmoUrl, atomUrl, buyAssetDenom, 'channel-0', fee)
        console.info('txid: ', txid)
      }

      // @ts-ignore
      return { txid: txid1 || 'error' }
    }
    else {
      throw new SwapError('[executeTrade]: unsupported trade', {
        code: SwapErrorTypes.SIGN_AND_BROADCAST_FAILED,
        fn: 'executeTrade'
      })
    }
  }
}
