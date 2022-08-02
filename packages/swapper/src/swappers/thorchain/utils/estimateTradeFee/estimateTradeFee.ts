import { Asset, AssetService } from '@shapeshiftoss/asset-service'
import { adapters, fromAssetId } from '@shapeshiftoss/caip'

import { SwapError, SwapErrorTypes } from '../../../../api'
import { fromBaseUnit } from '../../../utils/bignumber'
import { InboundResponse, ThorchainSwapperDeps } from '../../types'
import { SUPPORTED_BUY_CHAINS, THOR_TRADE_FEE_MULTIPLIERS } from '../constants'
import { getPriceRatio } from '../getPriceRatio/getPriceRatio'
import { thorService } from '../thorService'

export const estimateTradeFee = async (
  deps: ThorchainSwapperDeps,
  buyAsset: Asset
): Promise<string> => {
  const thorId = adapters.assetIdToPoolAssetId({ assetId: buyAsset.assetId })
  if (!thorId)
    throw new SwapError('[estimateTradeFee] - undefined thorId for given buyAssetId', {
      code: SwapErrorTypes.VALIDATION_FAILED,
      details: { buyAssetId: buyAsset.assetId }
    })

  const thorPoolChainId = thorId.slice(0, thorId.indexOf('.'))

  const { data: inboundAddresses } = await thorService.get<InboundResponse[]>(
    `${deps.midgardUrl}/thorchain/inbound_addresses`
  )

  const inboundInfo = inboundAddresses.find((inbound) => inbound.chain === thorPoolChainId)

  if (!inboundInfo)
    throw new SwapError('[estimateTradeFee] - unable to locate inbound pool info', {
      code: SwapErrorTypes.VALIDATION_FAILED,
      details: { thorPoolChainId }
    })

  const gasRate = inboundInfo.gas_rate
  const { chainId: buyChainId } = fromAssetId(buyAsset.assetId)

  const buyAdapter = deps.adapterManager.get(buyChainId)

  if (!buyAdapter)
    throw new SwapError('[estimateTradeFee] - unable to get buy asset adapter', {
      code: SwapErrorTypes.VALIDATION_FAILED,
      details: { buyChainId }
    })

  const buyFeeAssetId = buyAdapter.getFeeAssetId()

  if (!buyFeeAssetId)
    throw new SwapError('[estimateTradeFee] - no fee assetId', {
      code: SwapErrorTypes.VALIDATION_FAILED,
      details: { buyAssetId: buyAsset.assetId }
    })

  const buyFeeAssetRatio =
    buyAsset.assetId !== buyFeeAssetId
      ? await getPriceRatio(deps, {
          sellAssetId: buyAsset.assetId,
          buyAssetId: buyFeeAssetId
        })
      : '1'

  const buyFeeAsset = new AssetService().getAll()[buyFeeAssetId]

  return fromBaseUnit(
    THOR_TRADE_FEE_MULTIPLIERS[buyChainId as SUPPORTED_BUY_CHAINS]
      .times(buyFeeAssetRatio)
      .times(gasRate)
      .dp(0),
    buyFeeAsset.precision
  )
}
