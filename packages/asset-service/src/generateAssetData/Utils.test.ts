import { BaseAsset } from '@shapeshiftoss/types'

import { BTCMockedAsset, ETHMockedAsset } from '../service/AssetServiceTestData'
import blacklist from './blacklist.json'
import { filterBlacklistedAssets } from './utils'

const blacklistedAssets: string[] = blacklist

jest.mock('./blacklist.json', () => [ETHMockedAsset.tokens![0].caip19, BTCMockedAsset.caip19], {
  virtual: true
})

const assetList: BaseAsset[] = [Object.assign({}, ETHMockedAsset), BTCMockedAsset]

describe('Utils', () => {
  describe('filterBlacklistedAssets', () => {
    it('should filter BTC from the asset list', () => {
      const filteredAssetList = filterBlacklistedAssets(blacklistedAssets, assetList)
      expect(filteredAssetList[0]).toHaveProperty('caip19', ETHMockedAsset.caip19)
    })

    it('should filter ERC20 from the asset list', () => {
      const filteredAssetList = filterBlacklistedAssets(blacklistedAssets, assetList)
      const ethFiltered = filteredAssetList[0]
      const remainingToken = ETHMockedAsset.tokens![1]

      expect(ethFiltered.tokens![0]).toHaveProperty('caip19', remainingToken.caip19)
    })
  })
})
