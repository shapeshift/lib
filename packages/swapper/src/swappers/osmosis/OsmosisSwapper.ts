import { AssetId, ChainId, cosmosChainId, osmosisChainId } from '@shapeshiftoss/caip'
import { cosmos, osmosis } from '@shapeshiftoss/chain-adapters'
import { bip32ToAddressNList } from '@shapeshiftoss/hdwallet-core'
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
import { DEFAULT_SOURCE, FEE, GAS, MAX_SWAPPER_SELL } from './utils/constants'
import {
  getRateInfo,
  IsymbolDenomMapping,
  performIbcTransfer,
  pollForAtomChannelBalance,
  pollForComplete,
  symbolDenomMapping
} from './utils/helpers'
import { OsmoSwapperDeps } from './utils/types'
export class OsmosisSwapper implements Swapper<ChainId> {
  readonly name = 'Osmosis'
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

  async buildTrade(args: BuildTradeInput): Promise<Trade<ChainId>> {
    const { sellAsset, buyAsset, sellAmount } = args

    if (!sellAmount) {
      throw new Error('sellAmount is required')
    }

    const { tradeFee, rate, buyAmount } = await getRateInfo(
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
      feeData: { fee: FEE, tradeFee },
      rate,
      receiveAddress: '',
      sellAmount: amountBaseSellString,
      sellAsset,
      sellAssetAccountNumber: 0,
      buyAssetAccountNumber: 0,
      sources: [{ name: 'Osmosis', proportion: '100' }]
    }
  }

  async getTradeQuote(input: GetTradeQuoteInput): Promise<TradeQuote<ChainId>> {
    const { sellAsset, buyAsset, sellAmount } = input
    if (!sellAmount) {
      throw new Error('sellAmount is required')
    }
    const { tradeFee, rate, buyAmount } = await getRateInfo(
      sellAsset.symbol,
      buyAsset.symbol,
      sellAmount !== '0' ? sellAmount : '1',
      this.deps.osmoUrl
    )

    const { minimum, maximum } = await this.getMinMax(input)

    return {
      buyAsset,
      feeData: { fee: FEE, tradeFee },
      maximum,
      minimum,
      sellAssetAccountNumber: 0,
      buyAssetAccountNumber: 0,
      rate,
      sellAsset,
      sellAmount,
      buyAmount,
      sources: DEFAULT_SOURCE,
      allowanceContract: ''
    }
  }

  async executeTrade({ trade, wallet }: ExecuteTradeInput<ChainId>): Promise<TradeResult> {
    const { sellAsset, buyAsset, sellAmount, sellAssetAccountNumber, buyAssetAccountNumber } = trade

    const pair = sellAsset.symbol + '_' + buyAsset.symbol
    const isFromOsmo = pair === 'OSMO_ATOM'
    const sellAssetDenom = symbolDenomMapping[sellAsset.symbol as keyof IsymbolDenomMapping]
    const buyAssetDenom = symbolDenomMapping[buyAsset.symbol as keyof IsymbolDenomMapping]
    let ibcSellAmount

    const osmosisAdapter = this.deps.adapterManager.get(osmosisChainId) as
      | osmosis.ChainAdapter
      | undefined
    const cosmosAdapter = this.deps.adapterManager.get(cosmosChainId) as
      | cosmos.ChainAdapter
      | undefined

    if (cosmosAdapter && osmosisAdapter) {
      let sellAddress
      let buyAddress

      if (!isFromOsmo) {
        const buyBip44Params = osmosisAdapter.buildBIP44Params({
          accountNumber: Number(buyAssetAccountNumber)
        })
        const sellBip44Params = cosmosAdapter.buildBIP44Params({
          accountNumber: Number(sellAssetAccountNumber)
        })

        buyAddress = await osmosisAdapter.getAddress({ wallet, bip44Params: buyBip44Params })
        sellAddress = await cosmosAdapter.getAddress({ wallet, bip44Params: sellBip44Params })

        if (!buyAddress) throw Error('Failed to get osmoAddress!')
        if (!sellAddress) throw Error('Failed to get atomAddress!')

        const transfer = {
          sender: sellAddress,
          receiver: buyAddress,
          amount: String(sellAmount)
        }

        const { tradeId } = await performIbcTransfer(
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

        ibcSellAmount = await pollForAtomChannelBalance(buyAddress, this.deps.osmoUrl)
      } else if (isFromOsmo) {
        const buyBip44Params = cosmosAdapter.buildBIP44Params({
          accountNumber: Number(buyAssetAccountNumber)
        })
        const sellBip44Params = osmosisAdapter.buildBIP44Params({
          accountNumber: Number(sellAssetAccountNumber)
        })

        buyAddress = await cosmosAdapter.getAddress({ wallet, bip44Params: buyBip44Params })
        sellAddress = await osmosisAdapter.getAddress({ wallet, bip44Params: sellBip44Params })

        if (!buyAddress) throw Error('Failed to get cosmosAddress!')
        if (!sellAddress) throw Error('Failed to get osmoAddress!')
      } else {
        throw Error('Pair not supported! ' + pair)
      }
      const osmoAddress = isFromOsmo ? sellAddress : buyAddress
      const accountUrl = `${this.deps.osmoUrl}/auth/accounts/${osmoAddress}`
      const responseAccount = await axios.get(accountUrl)
      const accountNumber = responseAccount.data.result.value.account_number || 0
      const sequence = responseAccount.data.result.value.sequence || 0

      const osmoAddressNList = bip32ToAddressNList("m/44'/118'/0'/0/0")

      const tx1 = {
        memo: '',
        fee: {
          amount: [
            {
              amount: FEE.toString(),
              denom: 'uosmo'
            }
          ],
          gas: GAS
        },
        signatures: null,
        msg: [
          {
            type: 'osmosis/gamm/swap-exact-amount-in',
            value: {
              sender: osmoAddress,
              routes: [
                {
                  poolId: '1', // TODO: should probably get this from the util pool call
                  tokenOutDenom: buyAssetDenom
                }
              ],
              tokenIn: {
                denom: sellAssetDenom,
                amount: ibcSellAmount ?? sellAmount
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

      if (isFromOsmo) {
        const pollResult = await pollForComplete(txid1, this.deps.osmoUrl)
        if (pollResult !== 'success') throw new Error('osmo swap failed')

        const amount = await pollForAtomChannelBalance(sellAddress, this.deps.osmoUrl)
        const transfer = {
          sender: sellAddress,
          receiver: buyAddress,
          amount: String(amount)
        }

        await performIbcTransfer(
          transfer,
          osmosisAdapter,
          wallet,
          this.deps.osmoUrl,
          this.deps.cosmosUrl,
          buyAssetDenom,
          'channel-0',
          FEE
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
