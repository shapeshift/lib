import { CHAIN_NAMESPACE, ChainId, fromAssetId } from '@shapeshiftoss/caip'
import { ChainAdapter, UtxoBaseAdapter } from '@shapeshiftoss/chain-adapters'
import { KnownChainIds } from '@shapeshiftoss/types'

import {
  GetTradeQuoteInput,
  GetUtxoTradeQuoteInput,
  SwapError,
  SwapErrorTypes,
  TradeQuote,
  UtxoSupportedChainIds,
} from '../../../api'
import { bn, bnOrZero, fromBaseUnit, toBaseUnit } from '../../utils/bignumber'
import { DEFAULT_SLIPPAGE } from '../../utils/constants'
import { ThorchainSwapperDeps } from '../types'
import { getThorTxInfo as getBtcThorTxInfo } from '../utils/bitcoin/utils/getThorTxData'
import { MAX_THORCHAIN_TRADE, THOR_MINIMUM_PADDING } from '../utils/constants'
import { estimateBuyAssetTradeFeeCrypto } from '../utils/estimateBuyAssetTradeFeeCrypto/estimateBuyAssetTradeFeeCrypto'
import { getThorTxInfo as getEthThorTxInfo } from '../utils/ethereum/utils/getThorTxData'
import { getTradeRate } from '../utils/getTradeRate/getTradeRate'
import { getUsdRate } from '../utils/getUsdRate/getUsdRate'
import { isRune } from '../utils/isRune/isRune'
import { getBtcTxFees } from '../utils/txFeeHelpers/btcTxFees/getBtcTxFees'
import { getEthTxFees } from '../utils/txFeeHelpers/ethTxFees/getEthTxFees'

const MINIMUM_USD_TRADE_AMOUNT = bn(1)

type CommonQuoteFields = Omit<TradeQuote<ChainId>, 'allowanceContract' | 'feeData'>

type GetThorTradeQuoteInput = {
  deps: ThorchainSwapperDeps
  input: GetTradeQuoteInput
}

type GetThorTradeQuoteReturn = Promise<TradeQuote<ChainId>>

type GetThorTradeQuote = (args: GetThorTradeQuoteInput) => GetThorTradeQuoteReturn

export const getThorTradeQuote: GetThorTradeQuote = async ({ deps, input }) => {
  const { sellAsset, buyAsset, sellAmount, bip44Params, chainId, receiveAddress } = input

  if (!bip44Params) {
    throw new Error('bip44Params required in getThorTradeQuote')
  }

  try {
    const { assetReference: sellAssetReference } = fromAssetId(sellAsset.assetId)

    const sellAdapter = deps.adapterManager.get(chainId)
    if (!sellAdapter)
      throw new SwapError(`[getThorTradeQuote] - No chain adapter found for ${chainId}.`, {
        code: SwapErrorTypes.UNSUPPORTED_CHAIN,
        details: { chainId },
      })

    const rate = await getTradeRate(sellAsset, buyAsset.assetId, sellAmount, deps)

    const buyAmount = toBaseUnit(
      bnOrZero(fromBaseUnit(sellAmount, sellAsset.precision)).times(rate),
      buyAsset.precision,
    )

    const estimatedBuyAssetTradeFeeCrypto = await estimateBuyAssetTradeFeeCrypto(deps, buyAsset)

    const buyAssetUsdRate = await getUsdRate({ deps, input: { assetId: buyAsset.assetId } })
    const estimatedBuyAssetTradeFeeUsd = bn(estimatedBuyAssetTradeFeeCrypto)
      .div(buyAssetUsdRate)
      .toString()

    const buyAssetTradeFeeUsdOrMinimum = MINIMUM_USD_TRADE_AMOUNT.gt(estimatedBuyAssetTradeFeeUsd)
      ? MINIMUM_USD_TRADE_AMOUNT.toString()
      : estimatedBuyAssetTradeFeeUsd

    // The 1$ minimum doesn't seem to apply for swaps to RUNE
    const sellAssetTradeFeeCrypto = bnOrZero(
      isRune(buyAsset?.assetId) ? bn('0.02') : buyAssetTradeFeeUsdOrMinimum,
    ).times(rate)
    // minimum is tradeFee padded by an amount to be sure they get something back
    // usually it will be slightly more than the amount because sellAssetTradeFee is already a high estimate
    const minimum = bnOrZero(sellAssetTradeFeeCrypto).times(THOR_MINIMUM_PADDING).toString()

    const buyAssetTradeFeeUsdOrDefault = isRune(buyAsset?.assetId)
      ? bn('0.02').div(buyAssetUsdRate).toString()
      : buyAssetTradeFeeUsdOrMinimum

    const commonQuoteFields: CommonQuoteFields = {
      rate,
      maximum: MAX_THORCHAIN_TRADE,
      sellAmount,
      buyAmount,
      sources: [{ name: 'thorchain', proportion: '1' }],
      buyAsset,
      sellAsset,
      bip44Params,
      minimum,
    }

    const { chainNamespace } = fromAssetId(sellAsset.assetId)
    switch (chainNamespace) {
      case CHAIN_NAMESPACE.Evm:
        return (async (): Promise<TradeQuote<KnownChainIds.EthereumMainnet>> => {
          const { router } = await getEthThorTxInfo({
            deps,
            sellAsset,
            buyAsset,
            sellAmount,
            slippageTolerance: DEFAULT_SLIPPAGE,
            destinationAddress: receiveAddress,
            buyAssetTradeFeeUsd: buyAssetTradeFeeUsdOrMinimum,
          })
          const feeData = await getEthTxFees({
            adapterManager: deps.adapterManager,
            sellAssetReference,
            buyAssetTradeFeeUsd: buyAssetTradeFeeUsdOrMinimum,
          })

          return {
            ...commonQuoteFields,
            allowanceContract: router,
            feeData,
          }
        })()

      case CHAIN_NAMESPACE.Utxo:
        return (async (): Promise<TradeQuote<UtxoSupportedChainIds>> => {
          const { vault, opReturnData, pubkey } = await getBtcThorTxInfo({
            deps,
            sellAsset,
            buyAsset,
            sellAmount,
            slippageTolerance: DEFAULT_SLIPPAGE,
            destinationAddress: receiveAddress,
            xpub: (input as GetUtxoTradeQuoteInput).xpub,
            buyAssetTradeFeeUsd: buyAssetTradeFeeUsdOrMinimum,
          })

          const feeData = await getBtcTxFees({
            sellAmount,
            vault,
            opReturnData,
            pubkey,
            sellAdapter: sellAdapter as unknown as UtxoBaseAdapter<UtxoSupportedChainIds>,
            buyAssetTradeFeeUsd: buyAssetTradeFeeUsdOrMinimum,
          })

          return {
            ...commonQuoteFields,
            allowanceContract: '0x0', // not applicable to bitcoin
            feeData,
          }
        })()
      case CHAIN_NAMESPACE.CosmosSdk:
        return (async (): Promise<TradeQuote<KnownChainIds.CosmosMainnet>> => {
          const feeData = await (
            sellAdapter as ChainAdapter<KnownChainIds.CosmosMainnet>
          ).getFeeData({})

          return {
            ...commonQuoteFields,
            allowanceContract: '0x0', // not applicable to cosmos
            feeData: {
              fee: feeData.fast.txFee,
              networkFee: feeData.fast.txFee,
              tradeFee: buyAssetTradeFeeUsdOrDefault,
              buyAssetTradeFeeUsd: buyAssetTradeFeeUsdOrDefault,
              sellAssetTradeFeeUsd: '0',
              chainSpecific: { estimatedGas: feeData.fast.chainSpecific.gasLimit },
            },
          }
        })()
      default:
        throw new SwapError('[getThorTradeQuote] - Asset chainId is not supported.', {
          code: SwapErrorTypes.UNSUPPORTED_CHAIN,
          details: { chainId },
        })
    }
  } catch (e) {
    if (e instanceof SwapError) throw e
    throw new SwapError('[getThorTradeQuote]', {
      cause: e,
      code: SwapErrorTypes.TRADE_QUOTE_FAILED,
    })
  }
}
