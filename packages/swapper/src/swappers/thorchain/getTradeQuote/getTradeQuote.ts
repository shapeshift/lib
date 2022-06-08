import { fromAssetId, toChainId, getFeeAssetIdFromAssetId } from '@shapeshiftoss/caip'
import { TradeQuote, GetTradeQuoteInput, SwapError, SwapErrorTypes } from '../../../api'
import { fromBaseUnit } from '../../utils/bignumber'
import { SupportedChainIds } from '@shapeshiftoss/types'
import { ThorchainSwapperDeps } from '../types'
import { getPriceRatio } from '../utils/getPriceRatio/getPriceRatio'
import { bnOrZero } from '../../utils/bignumber'
import { getEthTxFees } from '../utils/txFeeHelpers/ethTxFees/getEthTxFees'
import { getThorTxInfo } from '../utils/ethereum/utils/getThorTxData'
import { DEFAULT_SLIPPAGE } from '../../utils/constants'
import { MAX_THORCHAIN_TRADE } from '../utils/constants'
import { normalizeAmount } from '../../zrx/utils/helpers/helpers'

export const getTradeQuote = async ({
  deps,
  input
}: {
  deps: ThorchainSwapperDeps
  input: GetTradeQuoteInput
}): Promise<TradeQuote<SupportedChainIds>> => {
  const { sellAsset, buyAsset, sellAmount, sellAssetAccountId, wallet } = input

  if (!wallet) throw new SwapError('[getTradeQuote] - wallet is required')

  const {
    assetReference: sellAssetErc20Address,
    chainReference,
    chainNamespace
  } = fromAssetId(sellAsset.assetId)

  const isErc20Trade = sellAssetErc20Address.startsWith('0x')
  const sellAssetChainId = toChainId({ chainReference, chainNamespace })
  const adapter = deps.adapterManager.byChainId(sellAssetChainId)
  const bip44Params = adapter.buildBIP44Params({ accountNumber: Number(sellAssetAccountId) })
  const receiveAddress = await adapter.getAddress({ wallet, bip44Params })

  const { data, router } = await getThorTxInfo({
    deps,
    sellAsset,
    buyAsset,
    sellAmount,
    slippageTolerance: DEFAULT_SLIPPAGE,
    destinationAddress: receiveAddress,
    isErc20Trade
  })

  const feeData = await (async () => {
    switch (sellAssetChainId) {
      case 'eip155:1':
        return await getEthTxFees({
          deps,
          data,
          router,
          buyAsset,
          sellAmount,
          adapterManager: deps.adapterManager,
          receiveAddress,
          sellAssetReference: sellAssetErc20Address
        })
      default:
        throw new SwapError('[getThorTxInfo] - Asset chainId is not supported.', {
          code: SwapErrorTypes.UNSUPPORTED_CHAIN,
          details: { sellAssetChainId }
        })
    }
  })()

  const sellAssetId = sellAsset.assetId
  const buyAssetId = buyAsset.assetId
  const feeAssetId = getFeeAssetIdFromAssetId(buyAssetId)
  if (!feeAssetId)
    throw new SwapError(`[getThorTxInfo] - No feeAssetId found for ${buyAssetId}.`, {
      code: SwapErrorTypes.BUILD_TRADE_FAILED,
      details: { buyAssetId }
    })

  const feeAssetRatio = await getPriceRatio(deps, { sellAssetId, buyAssetId: feeAssetId })
  const priceRatio = await getPriceRatio(deps, { sellAssetId, buyAssetId })
  const rate = bnOrZero(1).div(priceRatio).toString()
  const buyAmount = normalizeAmount(bnOrZero(sellAmount).times(rate))
  const sellAssetTradeFee = bnOrZero(feeData.tradeFee).times(bnOrZero(feeAssetRatio))
  const minimum = fromBaseUnit(sellAssetTradeFee.times(1.2).toString(), sellAsset.precision)

  return {
    rate,
    minimum,
    maximum: MAX_THORCHAIN_TRADE,
    feeData,
    sellAmount: sellAmount,
    buyAmount,
    sources: [{ name: 'thorchain', proportion: '1' }],
    allowanceContract: router,
    buyAsset,
    sellAsset,
    sellAssetAccountId
  }
}
