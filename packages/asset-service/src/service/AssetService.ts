import { CAIP2, CAIP19, caip19, WellKnownChain } from '@shapeshiftoss/caip'
import { Asset, AssetDataSource, BaseAsset, OmittedTokenAssetFields } from '@shapeshiftoss/types'
import axios from 'axios'

import assetsDescriptions from './descriptions.json'
import { getRenderedIdenticonBase64, IdenticonOptions } from './GenerateAssetIcon'
import localAssetData from './generatedAssetData.json'

export const flattenAssetData = (assetData: BaseAsset[]): Asset[] => {
  const flatAssetData: Asset[] = []
  for (const baseAsset of assetData) {
    const newAsset = { ...baseAsset }
    delete newAsset.tokens
    flatAssetData.push(newAsset)
    if (baseAsset.tokens) {
      for (const tokenAsset of baseAsset.tokens) {
        const omittedFields: OmittedTokenAssetFields = {
          slip44: baseAsset.slip44,
          explorer: baseAsset.explorer,
          explorerAddressLink: baseAsset.explorerAddressLink,
          explorerTxLink: baseAsset.explorerTxLink
        }
        flatAssetData.push({
          ...tokenAsset,
          ...omittedFields
        })
      }
    }
  }
  return flatAssetData
}

export const indexAssetData = (flatAssetData: Asset[]): IndexedAssetData => {
  return flatAssetData.reduce<IndexedAssetData>(
    (acc, val) => {
      acc.byAssetId.set(val.assetId, val)
      const { chainId } = caip19.fromCAIP19(val.assetId)
      const byChainId = (() => {
        let out = acc.byChainId.get(chainId)
        if (!out) {
          out = new Set()
          acc.byChainId.set(chainId, out)
        }
        return out
      })()
      byChainId.add(val)
      return acc
    },
    {
      byChainId: new Map(),
      byAssetId: new Map()
    }
  )
}

export type IndexedAssetData = {
  byAssetId: Map<CAIP19, Asset>
  byChainId: Map<CAIP2, Set<Asset>>
}

type DescriptionData = Readonly<{
  description: string
  isTrusted?: boolean
}>

export class AssetService {
  private assetFileUrl?: string

  private initialized = false
  private assetData: BaseAsset[]
  private indexedAssetData: IndexedAssetData

  constructor(assetFileUrl?: string) {
    this.assetFileUrl = assetFileUrl
  }

  private checkInitialized() {
    if (!this.initialized) throw new Error('Asset service not initialized')
  }

  /**
   * Get asset data from assetFileUrl and flatten it for easier use
   */
  async initialize() {
    if (this.initialized) return

    try {
      if (!this.assetFileUrl) throw new Error('No assetFileUrl')
      const { data } = await axios.get<BaseAsset[]>(this.assetFileUrl)
      if (!Array.isArray(data)) {
        throw new Error(`Asset Initialize: Return value ${data} is not valid`)
      }
      this.assetData = data
    } catch (err) {
      this.assetData = localAssetData as unknown as BaseAsset[]
    }

    this.indexedAssetData = indexAssetData(flattenAssetData(this.assetData))
    this.initialized = true
  }

  async byChainId(chainId: CAIP2): Promise<Set<Asset>> {
    const out = this.indexedAssetData.byChainId.get(chainId)
    if (!out) return new Set()
    return out
  }

  async byAssetId(assetId: CAIP19): Promise<Asset> {
    const out = this.indexedAssetData.byAssetId.get(assetId)
    if (!out) throw new Error(`no asset data matching assetId ${assetId}`)
    return out
  }

  async description({ asset }: { asset: Asset }): Promise<DescriptionData> {
    const descriptions: Record<string, string> = assetsDescriptions

    // Return overridden asset description if it exists and add isTrusted for description links
    if (descriptions[asset.assetId]) {
      return {
        description: descriptions[asset.assetId],
        isTrusted: true
      }
    }

    if (asset.dataSource !== AssetDataSource.CoinGecko) {
      return { description: '' }
    }

    const { chainId, assetReference: tokenId } = caip19.fromCAIP19(asset.assetId)
    const contractUrl = typeof tokenId === 'string' ? `/contract/${tokenId}` : ''

    const coingeckoCoinId = (() => {
      switch (chainId) {
        case WellKnownChain.BitcoinMainnet:
        case WellKnownChain.BitcoinTestnet:
          return 'bitcoin'
        case WellKnownChain.EthereumMainnet:
        case WellKnownChain.EthereumRopsten:
        case WellKnownChain.EthereumRinkeby:
        case WellKnownChain.EthereumKovan:
          return 'ethereum'
        case WellKnownChain.CosmosHubMainnet:
        case WellKnownChain.CosmosHubVega:
          return 'cosmos'
        case WellKnownChain.OsmosisMainnet:
        case WellKnownChain.OsmosisTestnet:
          return 'osmosis'
        default:
          throw new Error(`coingecko doesn't support chainId ${chainId}`)
      }
    })()

    try {
      type CoinData = {
        description: {
          en: string
        }
      }
      const { data } = await axios.get<CoinData>(
        `https://api.coingecko.com/api/v3/coins/${coingeckoCoinId}${contractUrl}`
      )

      return { description: data?.description?.en ?? '' }
    } catch (e) {
      throw new Error(
        `AssetService:description: no description available for ${tokenId} on chain ${coingeckoCoinId}`
      )
    }
  }

  async generateAssetIconBase64(
    identity: string,
    text?: string,
    options?: IdenticonOptions
  ): Promise<string> {
    return getRenderedIdenticonBase64(identity, text, options)
  }
}
