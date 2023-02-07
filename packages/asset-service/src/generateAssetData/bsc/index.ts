import { bscChainId } from '@shapeshiftoss/caip'

import { bsc } from '../baseAssets'
import * as coingecko from '../coingecko'

export const getAssets = async () => {
  const assets = await coingecko.getAssets(bscChainId)
  assets.push(bsc)
  return assets
}
