import { fromAssetId, toAssetId } from '../../assetId/assetId'
import { btcAssetId, ethAssetId, ethChainId } from '../../constants'
import { AssetId } from './../../assetId/assetId'
import { btcChainId } from './../../constants'

// https://regex101.com/r/j0zGtX/1
const thorIdRegex = /(?<THORChainChain>[A-Z]+)\.(?<symbol>[A-Z]+)-(?<contractAddress>[A-Z0-9]{42})/

/*
 * Note: this only works with thorchain assets we support
 * see https://dev.thorchain.org/thorchain-dev/memos#asset-notation for reference
 */
export const poolAssetIdToAssetId = (id: string): AssetId | undefined => {
  if (id === 'BTC.BTC') return btcAssetId
  if (id === 'ETH.ETH') return ethAssetId

  // ERC20's
  if (id.startsWith('ETH.')) {
    const matches = thorIdRegex.exec(id)?.groups

    const contractAddress = matches?.contractAddress
    if (!contractAddress) return undefined

    const chainId = ethChainId
    const assetNamespace = 'erc20'
    const assetReference = contractAddress.toLowerCase()

    return toAssetId({ chainId, assetNamespace, assetReference })
  }

  return undefined
}

export const assetIdToPoolAssetId = ({
  assetId,
  symbol
}: {
  assetId: AssetId
  symbol?: string
}): string | undefined => {
  try {
    const { chainId, assetReference } = fromAssetId(assetId)
    // https://dev.thorchain.org/thorchain-dev/memos#asset-notation
    switch (chainId) {
      case ethChainId: {
        if (assetId === ethAssetId) return 'ETH.ETH'
        if (!symbol) return undefined
        return `ETH.${symbol}-${assetReference.toUpperCase()}`
      }
      case btcChainId: {
        return 'BTC.BTC'
      }
      default: {
        return undefined
      }
    }
  } catch (e) {
    return undefined
  }
}
