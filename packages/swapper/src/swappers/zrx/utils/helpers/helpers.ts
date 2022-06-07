import { fromAssetId } from '@shapeshiftoss/caip'
import { Asset } from '@shapeshiftoss/types'
import { AxiosResponse } from 'axios'
import BigNumber from 'bignumber.js'

import { SwapError, SwapErrorTypes } from '../../../../api'
import { bn, bnOrZero } from '../../../utils/bignumber'
import { ZrxPriceResponse } from '../../types'
import { zrxService } from '../zrxService'

/**
 * Very large amounts like those found in ERC20s with a precision of 18 get converted
 * to exponential notation ('1.6e+21') in javascript. The 0x api doesn't play well with
 * exponential notation so we need to ensure that it is represented as an integer string.
 * This function keeps 17 significant digits, so even if we try to trade 1 Billion of an
 * ETH or ERC20, we still keep 7 decimal places.
 * @param amount
 */
export const normalizeAmount = (amount: string | number | BigNumber): string => {
  return bnOrZero(amount).toNumber().toLocaleString('fullwide', { useGrouping: false })
}

export const getUsdRate = async (asset: Asset): Promise<string> => {
  const { assetReference: erc20Address, assetNamespace } = fromAssetId(asset.assetId)
  const { symbol } = asset

  try {
    const USDC_CONTRACT_ADDRESS = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
    if (erc20Address?.toLowerCase() === USDC_CONTRACT_ADDRESS) return '1' // Will break if comparing against usdc
    const rateResponse: AxiosResponse<ZrxPriceResponse> = await zrxService.get<ZrxPriceResponse>(
      '/swap/v1/price',
      {
        params: {
          buyToken: USDC_CONTRACT_ADDRESS,
          buyAmount: '1000000000', // rate is imprecise for low $ values, hence asking for $1000
          sellToken: assetNamespace === 'erc20' ? erc20Address : symbol
        }
      }
    )

    const price = bnOrZero(rateResponse.data.price)

    if (!price.gt(0))
      throw new SwapError('[getUsdRate] - Failed to get price data', {
        code: SwapErrorTypes.RESPONSE_ERROR
      })

    return bn(1).dividedBy(price).toString()
  } catch (e) {
    if (e instanceof SwapError) throw e
    throw new SwapError('[getUsdRate]', {
      cause: e,
      code: SwapErrorTypes.USD_RATE_FAILED
    })
  }
}
