import { bscChainId } from '@shapeshiftoss/caip'

import { getRenderedIdenticonBase64 } from '../../service/GenerateAssetIcon'
import { bsc } from '../baseAssets'
import * as coingecko from '../coingecko'

export const getAssets = async () => {
  const assets = await coingecko.getAssets(bscChainId)
  assets.push(bsc)
  return assets.map((asset) => {
    if (!asset.icon) {
      asset.icon = getRenderedIdenticonBase64(asset.assetId, asset.symbol, {
        identiconImage: {
          size: 128,
          background: [45, 55, 72, 255],
        },
        identiconText: {
          symbolScale: 7,
          enableShadow: true,
        },
      })
    }
    return asset
  })
}
