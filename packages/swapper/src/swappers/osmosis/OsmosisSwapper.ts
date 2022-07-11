import { AssetId, ChainId, cosmosChainId, osmosisChainId } from '@shapeshiftoss/caip'
import { cosmos, osmosis } from '@shapeshiftoss/chain-adapters'
import {
  bip32ToAddressNList,
  CosmosWallet,
  HDWallet,
  OsmosisWallet
} from '@shapeshiftoss/hdwallet-core'
import { Asset } from '@shapeshiftoss/types'
import axios from 'axios'

import {
  ApprovalNeededOutput,
  BuildTradeInput,
  BuyAssetBySellIdInput,
  ExecuteTradeInput,
  GetTradeQuoteInput,
  MinMaxOutput,
  SwapError,
  SwapErrorTypes,
  Swapper,
  SwapperType,
  Trade,
  TradeQuote,
  TradeResult,
  TradeTxs
} from '../../api'
import { bn, bnOrZero } from '../utils/bignumber'
import { DEFAULT_SOURCE, MAX_SWAPPER_SELL } from './utils/constants'
import {
  getRateInfo,
  IsymbolDenomMapping,
  pollForAtomChannelBalance,
  pollForComplete,
  symbolDenomMapping
} from './utils/helpers'
import { IbcTransferInput, OsmoSwapperDeps } from './utils/types'

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
  async initialize() {}

  async getTradeTxs(tradeResult: TradeResult): Promise<TradeTxs> {
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
    const { rate: osmoRate } = await getRateInfo(
      'OSMO',
      buyAssetSymbol,
      sellAmount,
      this.deps.osmoUrl
    )

    if (sellAssetSymbol != 'OSMO') {
      const { rate } = await getRateInfo(sellAssetSymbol, 'OSMO', sellAmount, this.deps.osmoUrl)
      return bnOrZero(rate).times(osmoRate).toString()
    }

    return osmoRate
  }

  async getMinMax(input: { sellAsset: Asset }): Promise<MinMaxOutput> {
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

  filterBuyAssetsBySellAssetId(args: BuyAssetBySellIdInput): string[] {
    const { sellAssetId } = args
    if (!this.supportAssets.includes(sellAssetId)) return []
    return this.supportAssets
  }

  filterAssetIdsBySellable(): AssetId[] {
    return this.supportAssets
  }

  async performIbcTransfer(
    input: IbcTransferInput,
    adapter: cosmos.ChainAdapter | osmosis.ChainAdapter,
    wallet: HDWallet,
    accountBaseUrl: string,
    blockBaseUrl: string,
    denom: string,
    sourceChannel: string,
    feeAmount: string
  ): Promise<TradeResult> {
    const { sender, receiver, amount } = input

    const gas = '1350000'
    const responseLatestBlock = await axios.get(`${blockBaseUrl}/blocks/latest`)
    const latestBlock = responseLatestBlock.data.block.header.height

    const addressNList = bip32ToAddressNList("m/44'/118'/0'/0/0")

    const accountUrl = `${accountBaseUrl}/auth/accounts/${sender}`
    const responseAccount = await axios.get(accountUrl)
    const accountNumber = responseAccount.data.result.value.account_number
    const sequence = responseAccount.data.result.value.sequence

    if (!accountNumber) throw new Error('no atom account number')

    const tx1 = {
      memo: '',
      fee: {
        amount: [
          {
            amount: feeAmount.toString(), // having a fee here causes error
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

    const signed = await adapter.signTransaction({
      txToSign: {
        tx: tx1,
        addressNList,
        chain_id: 'osmosis-1',
        account_number: accountNumber,
        sequence
      },
      wallet
    })
    const tradeId = await adapter.broadcastTransaction(signed)

    return {
      tradeId
    }
  }

  async buildTrade(args: BuildTradeInput): Promise<Trade<ChainId>> {
    const { sellAsset, buyAsset, sellAmount } = args

    if (!sellAmount) {
      throw new Error('sellAmount is required')
    }

    const { rate, buyAmount } = await getRateInfo(
      sellAsset.symbol,
      buyAsset.symbol,
      sellAmount !== '0' ? sellAmount : '1',
      this.deps.osmoUrl
    )

    //convert amount to base
    let amountBaseSell: number = parseFloat(sellAmount)
    amountBaseSell = parseInt(String(amountBaseSell))
    const amountBaseSellString = amountBaseSell.toString()

    return {
      buyAmount,
      buyAsset,
      feeData: { fee, tradeFee: fee }, // TODO: and real tradeFee
      rate,
      receiveAddress: '',
      sellAmount: amountBaseSellString,
      sellAsset,
      sellAssetAccountNumber: 0,
      sources: [{ name: 'Osmosis', proportion: '100' }]
    }
  }

  async getTradeQuote(input: GetTradeQuoteInput): Promise<TradeQuote<ChainId>> {
    const { sellAsset, buyAsset, sellAmount } = input
    if (!sellAmount) {
      throw new Error('sellAmount is required')
    }
    const { rate, buyAmount } = await getRateInfo(
      sellAsset.symbol,
      buyAsset.symbol,
      sellAmount !== '0' ? sellAmount : '1',
      this.deps.osmoUrl
    )

    const { minimum, maximum } = await this.getMinMax(input)

    return {
      buyAsset,
      feeData: { fee, tradeFee: fee }, // TODO: give real trade fee
      maximum,
      minimum,
      sellAssetAccountNumber: 0,
      rate,
      sellAsset,
      sellAmount,
      buyAmount,
      sources: DEFAULT_SOURCE,
      allowanceContract: 'Allowance' // TODO: what is this
    }
  }

  async executeTrade(args: ExecuteTradeInput<ChainId>): Promise<TradeResult> {
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

    const osmosisAdapter = this.deps.adapterManager.get(osmosisChainId) as
      | osmosis.ChainAdapter
      | undefined
    const cosmosAdapter = this.deps.adapterManager.get(cosmosChainId) as
      | cosmos.ChainAdapter
      | undefined

    if (cosmosAdapter && osmosisAdapter) {
      const osmoAddress = await (wallet as OsmosisWallet).osmosisGetAddress({
        addressNList: bip32ToAddressNList("m/44'/118'/0'/0/0")
      })
      const atomAddress = await (wallet as CosmosWallet).cosmosGetAddress({
        addressNList: bip32ToAddressNList("m/44'/118'/0'/0/0")
      })

      if (!osmoAddress) throw Error('Failed to get osmoAddress!')
      if (!atomAddress) throw Error('Failed to get atomAddress!')

      let sellAddress
      let buyAddress

      if (pair === 'ATOM_OSMO') {
        sellAddress = atomAddress
        buyAddress = osmoAddress

        const transfer = {
          sender: sellAddress,
          receiver: buyAddress,
          amount: String(sellAmount)
        }

        const { tradeId } = await this.performIbcTransfer(
          transfer,
          cosmosAdapter,
          wallet,
          this.deps.cosmosUrl,
          this.deps.osmoUrl,
          'uatom',
          'channel-141',
          '0'
        )

        // wait till confirmed
        const pollResult = await pollForComplete(tradeId, this.deps.cosmosUrl)
        if (pollResult !== 'success') throw new Error('ibc transfer failed')

        sellAmount = await pollForAtomChannelBalance(buyAddress, this.deps.osmoUrl)
      } else if (pair === 'OSMO_ATOM') {
        sellAddress = osmoAddress
        buyAddress = atomAddress
      } else {
        throw Error('Pair not supported! ' + pair)
      }

      if (!sellAddress) throw new Error('no sell address')
      if (!buyAddress) throw new Error('no buy address')

      const sender = osmoAddress
      const accountUrl = `${this.deps.osmoUrl}/auth/accounts/${sender}`
      const responseAccount = await axios.get(accountUrl)
      const accountNumber = responseAccount.data.result.value.account_number || 0
      const sequence = responseAccount.data.result.value.sequence || 0
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
              sender,
              routes: [
                {
                  poolId: '1', // TODO: should probably get this from the util pool call
                  tokenOutDenom: buyAssetDenom
                }
              ],
              tokenIn: {
                denom: sellAssetDenom,
                amount: sellAmount
              },
              tokenOutMinAmount: '1' // TODO: slippage tolerance
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

      const signed = await osmosisAdapter.signTransaction(signTxInput)
      const txid1 = await osmosisAdapter.broadcastTransaction(signed)

      if (pair === 'OSMO_ATOM') {
        const pollResult = await pollForComplete(txid1, this.deps.osmoUrl)
        if (pollResult !== 'success') throw new Error('osmo swap failed')

        const amount = await pollForAtomChannelBalance(sender, this.deps.osmoUrl)
        const transfer = {
          sender: sellAddress,
          receiver: buyAddress,
          amount: String(amount)
        }

        await this.performIbcTransfer(
          transfer,
          osmosisAdapter,
          wallet,
          this.deps.osmoUrl,
          this.deps.cosmosUrl,
          buyAssetDenom,
          'channel-0',
          fee
        )
      }

      return { tradeId: txid1 || 'error' }
    } else {
      throw new SwapError('[executeTrade]: unsupported trade', {
        code: SwapErrorTypes.SIGN_AND_BROADCAST_FAILED,
        fn: 'executeTrade'
      })
    }
  }
}
