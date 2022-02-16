import { Asset, AssetDataSource, BaseAsset, ChainTypes, NetworkTypes } from '@shapeshiftoss/types'
import axios from 'axios'

import assetsDescriptions from './descriptions.json'
import localAssetData from './generatedAssetData.json'

export const flattenAssetData = (assetData: BaseAsset[]): Asset[] => {
  const flatAssetData: Asset[] = []
  for (const baseAsset of assetData) {
    const newAsset = { ...baseAsset }
    delete newAsset.tokens
    flatAssetData.push(newAsset)
    if (baseAsset.tokens) {
      for (const tokenAsset of baseAsset.tokens) {
        flatAssetData.push({
          ...tokenAsset,
          chain: baseAsset.chain,
          network: baseAsset.network,
          slip44: baseAsset.slip44,
          explorer: baseAsset.explorer,
          explorerAddressLink: baseAsset.explorerAddressLink,
          explorerTxLink: baseAsset.explorerTxLink
        })
      }
    }
  }
  return flatAssetData
}

const getDataIndexKey = (chain: ChainTypes, network: NetworkTypes, tokenId?: string): string => {
  return chain + '_' + network + (tokenId ? '_' + tokenId : '')
}

export const indexAssetData = (flatAssetData: Asset[]): IndexedAssetData => {
  return flatAssetData.reduce((acc, val) => {
    return { ...acc, [getDataIndexKey(val.chain, val.network, val.tokenId)]: val }
  }, {})
}

export type IndexedAssetData = {
  [k: string]: Asset
}

type ByTokenIdArgs = {
  chain: ChainTypes
  network?: NetworkTypes
  tokenId?: string
}

type DescriptionData = Readonly<{
  description: string
  isTrusted?: boolean
}>

export class AssetService {
  private assetFileUrl?: string

  private assetData: BaseAsset[]
  private flatAssetData: Asset[]
  private indexedAssetData: IndexedAssetData

  constructor(assetFileUrl?: string) {
    this.assetFileUrl = assetFileUrl
  }

  get isInitialized(): boolean {
    return Array.isArray(this.assetData) && Array.isArray(this.flatAssetData)
  }

  private checkInitialized() {
    if (!this.isInitialized) throw new Error('Asset service not initialized')
  }

  /**
   * Get asset data from assetFileUrl and flatten it for easier use
   */
  async initialize() {
    try {
      if (!this.assetFileUrl) throw new Error('No assetFileUrl')
      const { data } = await axios.get<BaseAsset[]>(this.assetFileUrl)
      if (!Array.isArray(data)) {
        throw new Error(`Asset Initialize: Return value ${data} is not valid`)
      }
      this.assetData = data
    } catch (err) {
      this.assetData = localAssetData as BaseAsset[]
    }

    this.flatAssetData = flattenAssetData(this.assetData)
    this.indexedAssetData = indexAssetData(this.flatAssetData)
  }

  /**
   * Get list of all assets on a given network (mainnet, ropsten, etc) or all assets across all networks
   * @param network mainnet, testnet, eth ropsten, etc
   * @returns base coins (ETH, BNB, etc...) along with their supported tokens in a flattened list
   */
  byNetwork(network?: NetworkTypes): Asset[] {
    this.checkInitialized()
    return network
      ? this.flatAssetData.filter((asset) => asset.network == network)
      : this.flatAssetData
  }

  /**
   * Find an asset by chain, network and tokenId
   * @param chain blockchain to look up by (btc, eth, etc...)
   * @param network mainnet, testnet, eth ropsten, etc
   * @param tokenId token identifier (contract address on eth)
   * @returns First asset found
   */
  byTokenId({ chain, network, tokenId }: ByTokenIdArgs): Asset {
    this.checkInitialized()
    const index = getDataIndexKey(chain, network ?? NetworkTypes.MAINNET, tokenId)
    const result = this.indexedAssetData[index]
    if (!result) {
      throw new Error(`AssetService:byTokenId: could not find tokenId ${tokenId}`)
    }
    return result
  }

  async description({ asset }: { asset: Asset }): Promise<DescriptionData> {
    const descriptions: Record<string, string> = assetsDescriptions

    // Return overridden asset description if it exists and add isTrusted for description links
    if (descriptions[asset.caip19]) {
      return {
        description: descriptions[asset.caip19],
        isTrusted: true
      }
    }

    if (asset.dataSource !== AssetDataSource.CoinGecko) {
      return { description: '' }
    }

    const contractUrl =
      typeof asset.tokenId === 'string' ? `/contract/${asset.tokenId?.toLowerCase()}` : ''
    const errorMessage = `AssetService:description: no description availble for ${asset.tokenId} on chain ${asset.chain}`

    try {
      type CoinData = {
        description: {
          en: string
        }
      }
      const { data } = await axios.get<CoinData>(
        `https://api.coingecko.com/api/v3/coins/${asset.chain}${contractUrl}`
      )

      return { description: data?.description?.en ?? '' }
    } catch (e) {
      throw new Error(errorMessage)
    }
  }
}
