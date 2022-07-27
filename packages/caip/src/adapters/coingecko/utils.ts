import axios from 'axios'
import fs from 'fs'

import { AssetId, toAssetId } from '../../assetId/assetId'
import { ChainId } from '../../chainId/chainId'
import {
  avalancheAssetId,
  avalancheChainId,
  btcChainId,
  CHAIN_NAMESPACE,
  CHAIN_REFERENCE,
  cosmosChainId,
  ethAssetId,
  ethChainId,
  osmosisChainId
} from '../../constants'
import { bitcoinAsset, cosmosAsset, osmosisAsset } from '../../utils'

export type CoingeckoCoin = {
  id: string
  symbol: string
  name: string
  platforms: Record<string, string>
}

type AssetMap = Record<ChainId, Record<AssetId, string>>

export const writeFiles = async (data: AssetMap) => {
  await Promise.all(
    Object.entries(data).map(async ([chainId, assets]) => {
      const path = `./src/adapters/coingecko/generated/${chainId}/adapter.json`.replace(':', '_')
      await fs.promises.writeFile(path, JSON.stringify(assets))
    })
  )
  console.info('Generated CoinGecko AssetId adapter data.')
}

export const fetchData = async (URL: string) => (await axios.get<CoingeckoCoin[]>(URL)).data

export const parseData = (coins: CoingeckoCoin[]): AssetMap => {
  const assetMap = coins.reduce<AssetMap>(
    (prev, { id, platforms }) => {
      if (Object.keys(platforms).includes('ethereum')) {
        try {
          const assetId = toAssetId({
            chainNamespace: CHAIN_NAMESPACE.Ethereum,
            chainReference: CHAIN_REFERENCE.EthereumMainnet,
            assetNamespace: 'erc20',
            assetReference: platforms.ethereum
          })
          prev[ethChainId][assetId] = id
        } catch {
          // unable to create assetId, skip token
        }
      }

      if (Object.keys(platforms).includes('avalanche')) {
        try {
          const assetId = toAssetId({
            chainNamespace: CHAIN_NAMESPACE.Ethereum,
            chainReference: CHAIN_REFERENCE.AvalancheCChain,
            assetNamespace: 'erc20',
            assetReference: platforms.avalanche
          })
          prev[avalancheChainId][assetId] = id
        } catch {
          // unable to create assetId, skip token
        }
      }

      return prev
    },
    {
      [ethChainId]: { [ethAssetId]: 'ethereum' },
      [avalancheChainId]: { [avalancheAssetId]: 'avalanche-2' }
    }
  )

  return {
    ...assetMap,
    [btcChainId]: bitcoinAsset,
    [cosmosChainId]: cosmosAsset,
    [osmosisChainId]: osmosisAsset
  }
}
