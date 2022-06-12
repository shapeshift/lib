import { btcChainId, ethChainId } from '@shapeshiftoss/caip'

import { chainIdToCoingeckoAssetPlatform } from './utils'

describe('chainIdToCoingeckoAssetPlatform', () => {
  it('can get Coingecko asset platform from ChainId', () => {
    const chainId = ethChainId
    expect(chainIdToCoingeckoAssetPlatform(chainId)).toEqual('ethereum')
  })

  it('throws on invalid ChainId', () => {
    const chainId = btcChainId
    expect(() => chainIdToCoingeckoAssetPlatform(chainId)).toThrow(
      'chainNamespace bip122, chainReference 000000000019d6689c085ae165831e93 not supported.'
    )
  })
})
