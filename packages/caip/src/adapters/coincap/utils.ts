import axios from 'axios'
import fs from 'fs'

import { WellKnownChain } from '../../caip2/caip2'
import { AssetNamespace, toCAIP19, WellKnownAsset } from '../../caip19/caip19'

export type CoinCapCoin = {
  id: string
  rank: string
  symbol: string
  name: string
  supply: string
  maxSupply: string | null
  marketCapUsd: string
  volumeUsd24Hr: string
  priceUsd: string
  changePercent24Hr: string
  vwap24Hr: string
  explorer: string | null
}

export const writeFiles = async (data: Record<string, Record<string, string>>) => {
  const path = './src/adapters/coincap/generated/'
  const file = '/adapter.json'
  const writeFile = async ([k, v]: [string, unknown]) =>
    await fs.promises.writeFile(`${path}${k}${file}`.replace(':', '_'), JSON.stringify(v))
  await Promise.all(Object.entries(data).map(writeFile))
  console.info('Generated CoinCap CAIP19 adapter data.')
}

export const fetchData = async (URL: string) =>
  (await axios.get<{ data: CoinCapCoin[] }>(URL)).data.data

const parseEthExplorerRegex = /^https:\/\/etherscan.io\/token\/(0x[0-9a-f]{40})/i

export const parseEthData = (data: CoinCapCoin[]) => {
  return data.reduce<Record<string, string>>((acc, { id, explorer }) => {
    if (id === 'ethereum') {
      acc[WellKnownAsset.ETH] = id
    } else if (explorer) {
      const result = parseEthExplorerRegex.exec(explorer)
      if (result) {
        acc[
          toCAIP19({
            chainId: WellKnownChain.EthereumMainnet,
            assetNamespace: AssetNamespace.ERC20,
            assetReference: result[1]
          })
        ] = id
      }
    }
    return acc
  }, {})
}

export const parseData = (d: CoinCapCoin[]) => ({
  [WellKnownChain.EthereumMainnet]: parseEthData(d),
  [WellKnownChain.BitcoinMainnet]: { [WellKnownAsset.BTC]: 'bitcoin' },
  [WellKnownChain.CosmosHubMainnet]: { [WellKnownAsset.ATOM]: 'cosmos' },
  [WellKnownChain.OsmosisMainnet]: { [WellKnownAsset.OSMO]: 'osmosis' }
})
