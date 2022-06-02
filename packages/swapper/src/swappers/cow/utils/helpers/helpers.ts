import { fromAssetId } from '@shapeshiftoss/caip'
import { Asset, ChainTypes, NetworkTypes } from '@shapeshiftoss/types'
import { AxiosResponse } from 'axios'

import { SwapError, SwapErrorTypes } from '../../../../api'
import { bn, bnOrZero } from '../../../utils/bignumber'
import { CowSwapperDeps } from '../../CowSwapper'
import { CowSwapPriceResponse } from '../../types'
import { cowService } from '../cowService'

const USDC_CONTRACT_ADDRESS = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'

export const getUsdRate = async (
  { assetService }: CowSwapperDeps,
  input: Pick<Asset, 'symbol' | 'assetId'>
): Promise<string> => {
  const { assetId } = input

  const { assetReference: erc20Address, assetNamespace } = fromAssetId(assetId)

  if (assetNamespace !== 'erc20') {
    throw new SwapError('[getUsdRate] - unsupported asset namespace', {
      code: SwapErrorTypes.USD_RATE_FAILED,
      details: { assetNamespace }
    })
  }

  const asset = assetService.byTokenId({
    chain: ChainTypes.Ethereum,
    network: NetworkTypes.MAINNET,
    tokenId: erc20Address
  })

  try {
    // rate is imprecise for low $ values, hence asking for $1000
    // cowSwap api used : markets/{baseToken}-{quoteToken}/{kind}/{amount}
    // It returns the estimated amount in quoteToken for either buying or selling amount of baseToken.
    const rateResponse: AxiosResponse<CowSwapPriceResponse> =
      await cowService.get<CowSwapPriceResponse>(
        '/v1/markets/' + USDC_CONTRACT_ADDRESS + '-' + erc20Address + '/buy/1000000000'
      )

    const tokenAmount = bnOrZero(rateResponse.data.amount).div(
      bn(10).exponentiatedBy(asset.precision)
    )

    if (!tokenAmount.gt(0))
      throw new SwapError('[getUsdRate] - Failed to get token amount', {
        code: SwapErrorTypes.RESPONSE_ERROR
      })

    // dividing $1000 by amount of token received
    return bn(1000).dividedBy(tokenAmount).toString()
  } catch (e) {
    if (e instanceof SwapError) throw e
    throw new SwapError('[getUsdRate]', {
      cause: e,
      code: SwapErrorTypes.USD_RATE_FAILED
    })
  }
}
