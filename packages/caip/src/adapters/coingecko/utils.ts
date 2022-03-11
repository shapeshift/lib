import axios from 'axios'
import fs from 'fs'

import { WellKnownChain } from '../../caip2/caip2'
import { AssetNamespace, toCAIP19, WellKnownAsset } from '../../caip19/caip19'

export type CoingeckoCoin = {
  id: string
  symbol: string
  name: string
  platforms: {
    [k: string]: string
  }
}

export const writeFiles = async (data: Record<string, Record<string, string>>) => {
  const path = './src/adapters/coingecko/generated/'
  const file = '/adapter.json'
  const writeFile = async ([k, v]: [string, unknown]) =>
    await fs.promises.writeFile(`${path}${k}${file}`.replace(':', '_'), JSON.stringify(v))
  await Promise.all(Object.entries(data).map(writeFile))
  console.info('Generated CoinGecko CAIP19 adapter data.')
}

export const fetchData = async (URL: string) => (await axios.get<CoingeckoCoin[]>(URL)).data

export const parseEthData = (data: CoingeckoCoin[]) => {
  return data.reduce<Record<string, string>>((acc, { id, platforms }) => {
    if (id === 'ethereum') {
      acc[WellKnownAsset.ETH] = id
    } else if (platforms?.ethereum) {
      acc[
        toCAIP19({
          chainId: WellKnownChain.EthereumMainnet,
          assetNamespace: AssetNamespace.ERC20,
          assetReference: platforms?.ethereum
        })
      ] = id
    }
    return acc
  }, {})
}

export const parseData = (d: CoingeckoCoin[]) => ({
  [WellKnownChain.EthereumMainnet]: parseEthData(d),
  [WellKnownChain.BitcoinMainnet]: { [WellKnownAsset.BTC]: 'bitcoin' },
  [WellKnownChain.CosmosHubMainnet]: { [WellKnownAsset.ATOM]: 'cosmos' },
  [WellKnownChain.OsmosisMainnet]: { [WellKnownAsset.OSMO]: 'osmosis' }
})
