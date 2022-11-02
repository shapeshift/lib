import { adapters, CHAIN_NAMESPACE, ChainId, fromAssetId } from '@shapeshiftoss/caip'
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
import { RUNE_OUTBOUND_TRANSACTION_FEE_CRYPTO_HUMAN } from '../constants'
import { ThorchainSwapperDeps } from '../types'
import { getThorTxInfo as getBtcThorTxInfo } from '../utils/bitcoin/utils/getThorTxData'
import {
  MAX_THORCHAIN_TRADE,
  THOR_MINIMUM_PADDING,
  THORCHAIN_FIXED_PRECISION,
} from '../utils/constants'
import { getInboundAddressDataForChain } from '../utils/getInboundAddressDataForChain'
import { getTradeRate } from '../utils/getTradeRate/getTradeRate'
import { getUsdRate } from '../utils/getUsdRate/getUsdRate'
import { isRune } from '../utils/isRune/isRune'
import { getBtcTxFees } from '../utils/txFeeHelpers/btcTxFees/getBtcTxFees'
import { getEthTxFees } from '../utils/txFeeHelpers/ethTxFees/getEthTxFees'

type CommonQuoteFields = Omit<TradeQuote<ChainId>, 'allowanceContract' | 'feeData'>

type GetThorTradeQuoteInput = {
  deps: ThorchainSwapperDeps
  input: GetTradeQuoteInput
}

type GetThorTradeQuoteReturn = Promise<TradeQuote<ChainId>>

type GetThorTradeQuote = (args: GetThorTradeQuoteInput) => GetThorTradeQuoteReturn

export const getThorTradeQuote: GetThorTradeQuote = async ({ deps, input }) => {
  const {
    sellAsset,
    buyAsset,
    sellAmountCryptoPrecision,
    bip44Params,
    chainId,
    receiveAddress,
    sendMax,
  } = input

  if (!bip44Params) {
    throw new Error('bip44Params required in getThorTradeQuote')
  }

  try {
    const { assetReference: sellAssetReference } = fromAssetId(sellAsset.assetId)
    const { chainId: buyAssetChainId } = fromAssetId(buyAsset.assetId)

    const sellAdapter = deps.adapterManager.get(chainId)
    const buyAdapter = deps.adapterManager.get(buyAssetChainId)
    if (!sellAdapter || !buyAdapter)
      throw new SwapError(
        `[getThorTradeQuote] - No chain adapter found for ${chainId} or ${buyAssetChainId}.`,
        {
          code: SwapErrorTypes.UNSUPPORTED_CHAIN,
          details: { sellAssetChainId: chainId, buyAssetChainId },
        },
      )

    const rate = await getTradeRate(sellAsset, buyAsset.assetId, sellAmountCryptoPrecision, deps)

    const buyAmountCryptoPrecision = toBaseUnit(
      bnOrZero(fromBaseUnit(sellAmountCryptoPrecision, sellAsset.precision)).times(rate),
      buyAsset.precision,
    )

    const buyAssetPoolId = adapters.assetIdToPoolAssetId({ assetId: buyAsset.assetId })
    const buyAssetChainSymbol = buyAssetPoolId?.slice(0, buyAssetPoolId.indexOf('.'))
    const buyAssetAddressData = await getInboundAddressDataForChain(
      deps.daemonUrl,
      buyAssetChainSymbol,
    )

    const estimatedBuyAssetTradeFeeFeeAssetCryptoHuman = isRune(buyAsset.assetId)
      ? RUNE_OUTBOUND_TRANSACTION_FEE_CRYPTO_HUMAN.toString()
      : fromBaseUnit(bnOrZero(buyAssetAddressData?.outbound_fee), THORCHAIN_FIXED_PRECISION)

    const buyAssetChainFeeAssetId = buyAdapter.getFeeAssetId()

    const sellAssetUsdRate = await getUsdRate({ deps, input: { assetId: sellAsset.assetId } })
    const buyFeeAssetUsdRate = await getUsdRate({
      deps,
      input: { assetId: buyAssetChainFeeAssetId },
    })

    const buyAssetTradeFeeUsd = bn(buyFeeAssetUsdRate)
      .times(estimatedBuyAssetTradeFeeFeeAssetCryptoHuman)
      .toString()

    const minimumSellAssetAmountCryptoHuman = bnOrZero(buyAssetTradeFeeUsd).div(sellAssetUsdRate)

    // minimum is tradeFee padded by an amount to be sure they get something back
    // usually it will be slightly more than the amount because sellAssetTradeFee is already a high estimate
    const minimumSellAssetAmountPaddedCryptoHuman = bnOrZero(minimumSellAssetAmountCryptoHuman)
      .times(THOR_MINIMUM_PADDING)
      .toString()

    const commonQuoteFields: CommonQuoteFields = {
      rate,
      maximum: MAX_THORCHAIN_TRADE,
      sellAmountCryptoPrecision,
      buyAmountCryptoPrecision,
      sources: [{ name: 'thorchain', proportion: '1' }],
      buyAsset,
      sellAsset,
      bip44Params,
      minimumCryptoHuman: minimumSellAssetAmountPaddedCryptoHuman,
    }

    const { chainNamespace } = fromAssetId(sellAsset.assetId)
    switch (chainNamespace) {
      case CHAIN_NAMESPACE.Evm:
        return (async (): Promise<TradeQuote<KnownChainIds.EthereumMainnet>> => {
          const ethAddressData = await getInboundAddressDataForChain(deps.daemonUrl, 'ETH')
          const router = ethAddressData?.router
          if (!router) throw new SwapError('[getThorTradeQuote] No router address found for ETH')

          const feeData = await getEthTxFees({
            adapterManager: deps.adapterManager,
            sellAssetReference,
            buyAssetTradeFeeUsd,
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
            sellAmountCryptoPrecision,
            slippageTolerance: DEFAULT_SLIPPAGE,
            destinationAddress: receiveAddress,
            xpub: (input as GetUtxoTradeQuoteInput).xpub,
            buyAssetTradeFeeUsd,
          })

          const feeData = await getBtcTxFees({
            sellAmountCryptoPrecision,
            vault,
            opReturnData,
            pubkey,
            sellAdapter: sellAdapter as unknown as UtxoBaseAdapter<UtxoSupportedChainIds>,
            buyAssetTradeFeeUsd,
            sendMax,
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
              networkFee: feeData.fast.txFee,
              buyAssetTradeFeeUsd,
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
