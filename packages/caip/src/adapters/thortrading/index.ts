import { toAssetId } from '../../assetId/assetId'
import { btcAssetId, ethAssetId, ethChainId } from '../../constants'

/*
 * Note: this only works with thorchain assets we support
 */
export const poolAssetIdToAssetId = (id: string): string | undefined => {
  if (id === 'BTC.BTC') return btcAssetId
  if (id === 'ETH.ETH') return ethAssetId

  // ERC20's
  if (id.startsWith('ETH.')) {
    // https://regex101.com/r/a0odJd/1
    const thorIdRegex =
      /(?<THORChainChain>[A-Z]+)\.(?<symbol>[A-Z]+)-(?<contractAddress>[A-Z0-9]{42})/
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
