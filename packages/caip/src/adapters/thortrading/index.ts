import { fromAssetId, toAssetId } from '../../assetId/assetId'
import { btcAssetId, ethAssetId, ethChainId } from '../../constants'
import { AssetId } from './../../assetId/assetId'
import { btcChainId } from './../../constants'

// https://regex101.com/r/j0zGtX/1
const thorIdRegex =
  /(?<THORChainChain>[A-Z]+)\.(?<symbol>[A-Z]+)(-(?<contractAddress>[A-Z0-9]{42}))?/

/*
 * Note: this only works with thorchain assets we support
 * see https://dev.thorchain.org/thorchain-dev/memos#asset-notation for reference
 */
export const poolAssetIdToAssetId = (id: string): AssetId | undefined => {
  const matches = thorIdRegex.exec(id)?.groups
  const THORChainChain = matches?.THORChainChain
  const symbol = matches?.symbol

  switch (THORChainChain) {
    case 'ETH': {
      if (id === 'ETH.ETH') return ethAssetId
      if (THORChainChain === 'ETH' && symbol === 'ETH') return ethAssetId

      const contractAddress = matches?.contractAddress
      if (!contractAddress) return undefined

      const chainId = ethChainId
      const assetNamespace = 'erc20'
      const assetReference = contractAddress.toLowerCase()

      return toAssetId({ chainId, assetNamespace, assetReference })
    }
    case 'BTC': {
      return btcAssetId
    }
    default: {
      return undefined
    }
  }
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
        // this is predicated on the assumption that the symbol from the asset service
        // and the contract address are static, correct, and won't ever change
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
