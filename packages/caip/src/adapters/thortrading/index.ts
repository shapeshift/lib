import toLower from 'lodash/toLower'
import { toAssetId } from '../../assetId/assetId'
import { btcAssetId, ethAssetId, ethChainId } from '../../constants'

const chainIdToThorPoolChain = {
  'bip122:000000000019d6689c085ae165831e93': 'BTC',
  'eip155:1': 'ETH'
} as Record<string, string>

const invert = <T extends Record<string, string>>(data: T) =>
  Object.entries(data).reduce((acc, [k, v]) => ((acc[v] = k), acc), {} as Record<string, string>)

const thorPoolChainToChainId = invert(chainIdToThorPoolChain)

export const poolChainIdToChainId = (id: string): string | undefined => thorPoolChainToChainId[id]

export const chainIdToPoolChain = (assetId: string): string | undefined =>
  chainIdToThorPoolChain[toLower(assetId)]

/*
* Note: this only works with thorchain assets we support
*/
export const poolAssetIdToAssetId = (id: string): string | undefined => {
  if (id === 'BTC.BTC') return btcAssetId
  if (id === 'ETH.ETH') return ethAssetId

  // Erc20's
  if (id.startsWith('ETH.') && id.length > 4) {
    const address = id.split('-')[1]

    return toAssetId({
      chainId: ethChainId,
      assetNamespace: 'erc20',
      assetReference: address.toLowerCase()
    })
  }

  return undefined
}
