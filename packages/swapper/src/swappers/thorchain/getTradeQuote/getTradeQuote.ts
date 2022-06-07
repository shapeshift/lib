import { fromAssetId, toChainId } from '@shapeshiftoss/caip'
import { TradeQuote, GetTradeQuoteInput, SwapError } from '../../../api'
import { SupportedChainIds } from '@shapeshiftoss/types'
import { ThorchainSwapperDeps } from '../types'
import { getPriceRatio } from '../utils/getPriceRatio/getPriceRatio'
import { bnOrZero } from '../../utils/bignumber'
import { getEthTxFees } from '../utils/txFeeHelpers/ethTxFees/getEthTxFees'
import { getThorTxInfo } from '../utils/ethereum/utils/getThorTxData'
import { DEFAULT_SLIPPAGE } from '../../utils/constants'

export const getTradeQuote = ({
  deps,
  input
}: {
  deps: ThorchainSwapperDeps
  input: GetTradeQuoteInput
}): Promise<TradeQuote<SupportedChainIds>> => {
  const { sellAsset, buyAsset, sellAmount, sellAssetAccountId, wallet } = input

  if (!wallet) throw new SwapError('[getTradeQuote] - wallet is required')

  const { assetReference: sellAssetErc20Address, chainReference, chainNamespace } = fromAssetId(
    sellAsset.assetId
  )

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
    sellAssetReference: sellAssetErc20Address,
    slippageTolerance: DEFAULT_SLIPPAGE,
    destinationAddress: receiveAddress,
    isErc20Trade
  })

  const feeData = (() => {
    switch (sellAssetChainId) {
      case 'eip155:1':
        return getEthTxFees({
        data,
        router,
        sellAmount,
        adapter,
        receiveAddress
        })
      default:
        return '' // TODO(ryankk): fix this
    }
  })()

  const sellAssetId = sellAsset.assetId
  const buyAssetId = buyAsset.assetId
  const rate = getPriceRatio(deps, { sellAssetId, buyAssetId })
  const buyAmount = bnOrZero(sellAmount).times(rate).toString() ?? '0'

  // return value
  return {
    rate,
    minimum: '1', // TODO: make this real min
    maximum: '10000', // TODO: make this real max
    feeData,
    sellAmount: sellAmount,
    buyAmount,
    sources: ['thorchain'], // TODO(ryankk): is this right?,
    allowanceContract: router, // use `inbound_addresses` api
    buyAsset,
    sellAsset,
    sellAssetAccountId
  }
}
