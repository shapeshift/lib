import { BaseAsset } from '@shapeshiftoss/types'

import { filterBlacklistedAssets } from './generateAssetData'

jest.mock(
  './blacklist.json',
  () => [
    'bip122:000000000019d6689c085ae165831e93/slip44:0',
    'eip155:1/erc20:0x426ca1ea2406c07d75db9585f22781c096e3d0e0'
  ],
  { virtual: true }
)

const BtcAsset = {
  caip19: 'bip122:000000000019d6689c085ae165831e93/slip44:0'
}

const ERC20Asset = {
  caip19: 'eip155:1/erc20:0x426ca1ea2406c07d75db9585f22781c096e3d0e0'
}

const EthAsset = {
  caip19: 'eip155:3/slip44:60',
  tokens: [ERC20Asset]
}

const assetList = [EthAsset, BtcAsset, ERC20Asset] as BaseAsset[]

describe('Utils', () => {
  describe('filterBlacklistedAssets', () => {
    it('should filter BTC from the asset list', () => {
      const filteredAssetList = filterBlacklistedAssets(assetList)
      expect(filteredAssetList).toHaveLength(1)
    })

    it('should filter ERC20 from the asset list', () => {
      const filteredAssetList = filterBlacklistedAssets(assetList)
      const ethFiltered = filteredAssetList[0]
      expect(ethFiltered.tokens).toHaveLength(0)
    })
  })
})
