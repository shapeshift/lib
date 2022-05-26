import { toAssetId } from '../../assetId/assetId'
import { btcAssetId, ethAssetId, ethChainId } from '../../constants'

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
