import { ethChainId } from '@shapeshift/caip'
import { ChainId, fromAssetId, getFeeAssetIdFromAssetId } from '@shapeshiftoss/caip'
import { Asset } from '@shapeshiftoss/types'
import { btcChainId } from 'packages/caip/dist'

import { GetTradeQuoteInput, SwapError, SwapErrorTypes, SwapSource, TradeQuote } from '../../../api'
import { bnOrZero, fromBaseUnit } from '../../utils/bignumber'
import { DEFAULT_SLIPPAGE } from '../../utils/constants'
import { normalizeAmount } from '../../utils/helpers/helpers'
import { ThorchainSwapperDeps } from '../types'
import { getThorTxInfo as getBtcThorTxInfo } from '../utils/bitcoin/utils/getThorTxData'
import { MAX_THORCHAIN_TRADE } from '../utils/constants'
import { estimateTradeFee } from '../utils/estimateTradeFee/estimateTradeFee'
import { getThorTxInfo as getEthThorTxInfo } from '../utils/ethereum/utils/getThorTxData'
import { getPriceRatio } from '../utils/getPriceRatio/getPriceRatio'
import { getBtcTxFees } from '../utils/txFeeHelpers/btcTxFees/getBtcTxFees'
import { getEthTxFees } from '../utils/txFeeHelpers/ethTxFees/getEthTxFees'

export const getThorTradeQuote = async ({
  deps,
  input
}: {
  deps: ThorchainSwapperDeps
  input: GetTradeQuoteInput
}): Promise<TradeQuote<ChainId>> => {
  const { sellAsset, buyAsset, sellAmount, sellAssetAccountNumber, wallet, chainId } = input

  if (!wallet)
    throw new SwapError('[getTradeQuote] - wallet is required', {
      code: SwapErrorTypes.VALIDATION_FAILED
    })

  try {
    const { assetReference: sellAssetErc20Address, assetNamespace } = fromAssetId(sellAsset.assetId)

    const isErc20Trade = assetNamespace === 'erc20'
    const adapter = deps.adapterManager.get(chainId)
    if (!adapter)
      throw new SwapError(`[getThorTradeQuote] - No chain adapter found for ${chainId}.`, {
        code: SwapErrorTypes.UNSUPPORTED_CHAIN,
        details: { chainId }
      })

    const sellAssetId = sellAsset.assetId
    const buyAssetId = buyAsset.assetId
    const feeAssetId = getFeeAssetIdFromAssetId(buyAssetId)
    if (!feeAssetId)
      throw new SwapError(`[getThorTradeQuote] - No feeAssetId found for ${buyAssetId}.`, {
        code: SwapErrorTypes.VALIDATION_FAILED,
        details: { buyAssetId }
      })

    const feeAssetRatio = await getPriceRatio(deps, { sellAssetId, buyAssetId: feeAssetId })
    const priceRatio = await getPriceRatio(deps, { sellAssetId, buyAssetId })
    const rate = bnOrZero(1).div(priceRatio).toString()
    const buyAmount = normalizeAmount(bnOrZero(sellAmount).times(rate))

    const tradeFee = await estimateTradeFee(deps, buyAsset.assetId)
    const sellAssetTradeFee = bnOrZero(tradeFee).times(bnOrZero(feeAssetRatio))
    // padding minimum by 1.5 the trade fee to avoid thorchain "not enough to cover fee" errors.
    const minimum = fromBaseUnit(sellAssetTradeFee.times(1.5).toString(), sellAsset.precision)

    type CommonQuoteFields = {
      rate: string
      maximum: string
      sellAmount: string
      buyAmount: string
      sources: [SwapSource]
      buyAsset: Asset
      sellAsset: Asset
      sellAssetAccountNumber: number
      minimum: string
    }
    const commonQuoteFields: CommonQuoteFields = {
      rate,
      maximum: MAX_THORCHAIN_TRADE,
      sellAmount,
      buyAmount,
      sources: [{ name: 'thorchain', proportion: '1' }],
      buyAsset,
      sellAsset,
      sellAssetAccountNumber,
      minimum
    }

    switch (chainId) {
      case ethChainId:
        return (async (): Promise<TradeQuote<'eip155:1'>> => {
          const bip44Params = adapter.buildBIP44Params({
            accountNumber: Number(sellAssetAccountNumber)
          })
          const receiveAddress = await adapter.getAddress({ wallet, bip44Params })
          const { data, router } = await getEthThorTxInfo({
            deps,
            sellAsset,
            buyAsset,
            sellAmount,
            slippageTolerance: DEFAULT_SLIPPAGE,
            destinationAddress: receiveAddress,
            isErc20Trade
          })
          const feeData = await getEthTxFees({
            deps,
            data,
            router,
            buyAsset,
            sellAmount,
            adapterManager: deps.adapterManager,
            receiveAddress,
            sellAssetReference: sellAssetErc20Address
          })

          return {
            ...commonQuoteFields,
            allowanceContract: router,
            feeData
          }
        })()

      case btcChainId:
        return (async (): Promise<TradeQuote<'bip122:000000000019d6689c085ae165831e93'>> => {
          const receiveAddress = await adapter.getAddress({
            wallet,
            bip44Params: input.bip44Params
          })

          const { vault, opReturnData, pubkey } = await getBtcThorTxInfo({
            deps,
            sellAsset,
            buyAsset,
            sellAmount,
            slippageTolerance: DEFAULT_SLIPPAGE,
            destinationAddress: receiveAddress,
            wallet,
            bip44Params: input.bip44Params,
            accountType: input.accountType
          })

          const feeData = await getBtcTxFees({
            deps,
            buyAsset,
            sellAmount,
            vault,
            opReturnData,
            pubkey,
            adapterManager: deps.adapterManager
          })

          return {
            ...commonQuoteFields,
            allowanceContract: '0x0',
            feeData
          }
        })()
      default:
        throw new SwapError('[getThorTradeQuote] - Asset chainId is not supported.', {
          code: SwapErrorTypes.UNSUPPORTED_CHAIN,
          details: { chainId }
        })
    }
  } catch (e) {
    if (e instanceof SwapError) throw e
    throw new SwapError('[getThorTradeQuote]', {
      cause: e,
      code: SwapErrorTypes.TRADE_QUOTE_FAILED
    })
  }
}
