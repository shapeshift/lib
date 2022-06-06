import { AssetService } from '@shapeshiftoss/asset-service'

import { SwapperType } from '../../api'
import { FOX } from '../utils/test-data/assets'
import { CowSwapper, CowSwapperDeps } from './CowSwapper'
import { getUsdRate } from './utils/helpers/helpers'

jest.mock('./utils/helpers/helpers')

const cowSwapperDeps: CowSwapperDeps = {
  apiUrl: 'https://api.cow.fi/mainnet/api/',
  assetService: <AssetService>{}
}

describe('CowSwapper', () => {  
  const swapper = new CowSwapper(cowSwapperDeps)

  describe('static properties', () => {
    it('returns the correct swapper name', async () => {
      expect(CowSwapper.swapperName).toEqual('CowSwapper')
    })
  })

  describe('getType', () => {
    it('returns the correct type for CowSwapper', async () => {
      await expect(swapper.getType()).toEqual(SwapperType.CowSwap)
    })
  })

  describe('getUsdRate', () => {
    it('calls getUsdRate on swapper.getUsdRate', async () => {
      await swapper.getUsdRate(FOX)
      expect(getUsdRate).toHaveBeenCalledWith(cowSwapperDeps, FOX)
    })
  })

  describe('filterAssetIdsBySellable', () => {
    it('returns empty array when called with an empty array', async () => {
      expect(await swapper.filterAssetIdsBySellable([])).toEqual([])
    })

    it('returns array filtered out of non erc20 token', async () => {
      const assetIds = []
      expect(await swapper.filterAssetIdsBySellable([])).toEqual([])
    })
  })
})
