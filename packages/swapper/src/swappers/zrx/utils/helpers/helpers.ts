import { AssetId, fromAssetId } from '@shapeshiftoss/caip'
import { Asset, KnownChainIds } from '@shapeshiftoss/types'
import { AxiosResponse } from 'axios'

import { SwapError, SwapErrorTypes } from '../../../../api'
import { bn, bnOrZero } from '../../../utils/bignumber'
import { ZrxPriceResponse } from '../../types'
import { zrxServiceFactory } from '../zrxService'

export const baseUrlFromChainId = (chainId: string): string | undefined => {
  switch (chainId) {
    case KnownChainIds.EthereumMainnet: {
      return 'https://api.0x.org/'
    }
    case KnownChainIds.AvalancheMainnet:
      return 'https://avalanche.api.0x.org/'
    default:
      return undefined
  }
}

export const usdcContractFromChainId = (chainId: string): string | undefined => {
  switch (chainId) {
    case KnownChainIds.EthereumMainnet: {
      return '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
    }
    case KnownChainIds.AvalancheMainnet:
      return '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e'
    default:
      return undefined
  }
}

export const isNativeEvmAsset = (assetId: AssetId): boolean | undefined => {
  const { chainId, assetNamespace, assetReference } = fromAssetId(assetId)
  switch (chainId) {
    case KnownChainIds.EthereumMainnet: {
      return assetNamespace === 'slip44' && assetReference === '60'
    }
    case KnownChainIds.AvalancheMainnet:
      return assetNamespace === 'slip44' && assetReference === '9000'
    default:
      return undefined
  }
}

export const getUsdRate = async (asset: Asset): Promise<string> => {
  const { assetReference: erc20Address, assetNamespace } = fromAssetId(asset.assetId)
  const { symbol } = asset

  try {
    const USDC_CONTRACT_ADDRESS = usdcContractFromChainId(asset.chainId)
    if (erc20Address?.toLowerCase() === USDC_CONTRACT_ADDRESS) return '1' // Will break if comparing against usdc
    const baseUrl = baseUrlFromChainId(asset.chainId)
    if (!(baseUrl && USDC_CONTRACT_ADDRESS))
      throw new SwapError('getUsdRate] - Unsupported chainId', {
        code: SwapErrorTypes.UNSUPPORTED_CHAIN
      })
    const zrxService = await zrxServiceFactory(baseUrl)
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
