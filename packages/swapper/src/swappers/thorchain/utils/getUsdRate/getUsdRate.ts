import { Asset } from '@shapeshiftoss/asset-service'
import { adapters, thorchainAssetId } from '@shapeshiftoss/caip'

import { SwapError, SwapErrorTypes } from '../../../../api'
import { bn, bnOrZero } from '../../../utils/bignumber'
import { PoolResponse, ThorchainSwapperDeps } from '../../types'
import { thorService } from '../thorService'

// not sure what to do for rune usd rate - inverting USDC pool rate for now
const usdcPool = 'ETH.USDC-0XA0B86991C6218B36C1D19D4A2E9EB0CE3606EB48'
export const getUsdRate = async ({
  deps,
  input,
}: {
  deps: ThorchainSwapperDeps
  input: Pick<Asset, 'assetId'>
}): Promise<string> => {
  const { assetId } = input
  try {
    const isRune = assetId === thorchainAssetId
    let thorchainPoolId = adapters.assetIdToPoolAssetId({ assetId })
    if (!thorchainPoolId && !isRune)
      throw new SwapError(`[getUsdRate]: No thorchainPoolId found for assetId: ${assetId}`, {
        code: SwapErrorTypes.USD_RATE_FAILED,
      })

    if (isRune) {
      thorchainPoolId = usdcPool
    }

    const { data: responseData } = await thorService.get<PoolResponse>(
      `${deps.midgardUrl}/pool/${thorchainPoolId}`,
    )

    let rate = responseData?.assetPriceUSD
    if (isRune) {
      const bnRate = bnOrZero(rate)
      if (bnRate.isZero()) {
        throw new SwapError('[getUsdRate]: cannot invert rate zero', {
          code: SwapErrorTypes.USD_RATE_FAILED,
        })
      }
      const inverseRate = bn(1).div(bnRate)
      rate = inverseRate.toFixed(8)
    }

    if (!rate)
      throw new SwapError(`[getUsdRate]: No rate for ${assetId}`, {
        code: SwapErrorTypes.USD_RATE_FAILED,
      })

    return rate
  } catch (e) {
    if (e instanceof SwapError) throw e
    throw new SwapError('[getUsdRate]: Thorchain getUsdRate failed', {
      code: SwapErrorTypes.USD_RATE_FAILED,
      cause: e,
    })
  }
}
