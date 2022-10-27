import { Asset } from '@shapeshiftoss/asset-service'
import { adapters, fromAssetId } from '@shapeshiftoss/caip'
import { getInboundAddressesForChain } from 'packages/swapper/src/swappers/thorchain/utils/getInboundAddressesForChain'

import { SwapError, SwapErrorTypes } from '../../../../api'
import { RUNE_OUTBOUND_TRANSACTION_FEE_CRYPTO_HUMAN } from '../../constants'
import { ThorchainSwapperDeps } from '../../types'
import { THOR_TRADE_FEE_MULTIPLIERS } from '../constants'
import { getPriceRatio } from '../getPriceRatio/getPriceRatio'
import { isRune } from '../isRune/isRune'

export const estimateBuyAssetTradeFeeCrypto = async (
  deps: ThorchainSwapperDeps,
  buyAsset: Asset,
): Promise<string> => {
  if (isRune(buyAsset.assetId)) {
    return RUNE_OUTBOUND_TRANSACTION_FEE_CRYPTO_HUMAN.toString()
  }
  const thorId = adapters.assetIdToPoolAssetId({ assetId: buyAsset.assetId })
  if (!thorId)
    throw new SwapError(
      '[estimateBuyAssetTradeFeeCrypto] - undefined thorId for given buyAssetId',
      {
        code: SwapErrorTypes.VALIDATION_FAILED,
        details: { buyAssetId: buyAsset.assetId },
      },
    )

  const thorPoolChainId = thorId.slice(0, thorId.indexOf('.'))
  const inboundInfo = await getInboundAddressesForChain(deps.daemonUrl, thorPoolChainId)

  if (!inboundInfo)
    throw new SwapError('[estimateBuyAssetTradeFeeCrypto] - unable to locate inbound pool info', {
      code: SwapErrorTypes.VALIDATION_FAILED,
      details: { thorPoolChainId },
    })

  const gasRate = inboundInfo.gas_rate
  const { chainId: buyChainId } = fromAssetId(buyAsset.assetId)

  const buyAdapter = deps.adapterManager.get(buyChainId)

  if (!buyAdapter)
    throw new SwapError('[estimateBuyAssetTradeFeeCrypto] - unable to get buy asset adapter', {
      code: SwapErrorTypes.VALIDATION_FAILED,
      details: { buyChainId },
    })

  const buyFeeAssetId = buyAdapter.getFeeAssetId()

  if (!buyFeeAssetId)
    throw new SwapError('[estimateBuyAssetTradeFeeCrypto] - no fee assetId', {
      code: SwapErrorTypes.VALIDATION_FAILED,
      details: { buyAssetId: buyAsset.assetId },
    })

  const buyFeeAssetRatio =
    buyAsset.assetId !== buyFeeAssetId
      ? await getPriceRatio(deps, {
          sellAssetId: buyAsset.assetId,
          buyAssetId: buyFeeAssetId,
        })
      : '1'

  if (!THOR_TRADE_FEE_MULTIPLIERS[buyChainId])
    throw new SwapError('[estimateBuyAssetTradeFeeCrypto] - no trade fee multiplier', {
      code: SwapErrorTypes.VALIDATION_FAILED,
      details: { buyChainId },
    })
  return THOR_TRADE_FEE_MULTIPLIERS[buyChainId].times(buyFeeAssetRatio).times(gasRate).toString()
}
