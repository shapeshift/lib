import { ChainTypes, NetworkTypes } from '@shapeshiftoss/types'
import axios from 'axios'
import fs from 'fs'

import { ASSET_REFERENCE, AssetNamespace, toAssetId } from '../../assetId/assetId'
import { CHAIN_NAMESPACE, CHAIN_REFERENCE, toChainId } from '../../chainId/chainId'

export type OsmosisCoin = {
  price: number
  denom: string
  symbol: string
  liquidity: number
  liquidity_24h_change: number
  volume_24h: number
  volume_24h_change: number
  name: string
  price_24h_change: number
}

export const writeFiles = async (data: Record<string, Record<string, string>>) => {
  const path = './src/adapters/osmosis/generated/'
  const file = '/adapter.json'
  const writeFile = async ([k, v]: [string, unknown]) =>
    await fs.promises.writeFile(`${path}${k}${file}`.replace(':', '_'), JSON.stringify(v))
  await Promise.all(Object.entries(data).map(writeFile))
  console.info('Generated Osmosis AssetId adapter data.')
}

export const fetchData = async (URL: string) => (await axios.get<OsmosisCoin[]>(URL)).data

export const parseOsmosisData = (data: OsmosisCoin[]) => {
  const results = data.reduce((acc, { denom, symbol }) => {
    // denoms for non native assets are formatted like so: 'ibc/27394...'
    const isNativeAsset = !denom.split('/')[1]
    const isOsmo = denom === 'uosmo'

    let assetNamespace: AssetNamespace
    let assetReference

    if (isNativeAsset) {
      assetReference = isOsmo ? ASSET_REFERENCE.Osmosis : denom
      assetNamespace = isOsmo ? 'slip44' : 'native'
    } else {
      assetReference = denom.split('/')[1]
      assetNamespace = 'ibc'
    }

    const chainNamespace = CHAIN_NAMESPACE.Cosmos
    const chainReference = CHAIN_REFERENCE.OsmosisMainnet
    const assetId = toAssetId({ chainNamespace, chainReference, assetNamespace, assetReference })

    acc[assetId] = symbol
    return acc
  }, {} as Record<string, string>)

  return results
}

export const parseData = (d: OsmosisCoin[]) => {
  const osmosisMainnet = toChainId({
    chain: ChainTypes.Osmosis,
    network: NetworkTypes.OSMOSIS_MAINNET
  })

  return {
    [osmosisMainnet]: parseOsmosisData(d)
  }
}
