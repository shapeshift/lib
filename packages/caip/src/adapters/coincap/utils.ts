import { ChainTypes, ContractTypes, NetworkTypes } from '@shapeshiftoss/types'
import axios from 'axios'
import fs from 'fs'

import { toCAIP2 } from '../../caip2/caip2'
import { toCAIP19 } from '../../caip19/caip19'

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

export const parseEthData = (data: CoinCapCoin[]) => {
  const ethCoins = data.filter(
    ({ id, explorer }) =>
      (explorer && explorer.startsWith('https://etherscan.io/token/0x')) || id === 'ethereum'
  )

  const chain = ChainTypes.Ethereum
  const network = NetworkTypes.MAINNET
  const contractType = ContractTypes.ERC20

  return ethCoins.reduce((acc, { id, explorer }) => {
    let tokenId
    if (id !== 'ethereum' && explorer) {
      tokenId = explorer.replace('https://etherscan.io/token/', '').split('#')[0].split('?')[0]
    }
    const caip19 = toCAIP19({ chain, network, ...(tokenId ? { contractType, tokenId } : {}) })
    acc[caip19] = id
    return acc
  }, {} as Record<string, string>)
}

export const makeBtcData = () => {
  const chain = ChainTypes.Bitcoin
  const network = NetworkTypes.MAINNET
  const caip19 = toCAIP19({ chain, network })
  return { [caip19]: 'bitcoin' }
}

export const makeCosmosHubData = () => {
  const chain = ChainTypes.Cosmos
  const network = NetworkTypes.COSMOSHUB_MAINNET
  const caip19 = toCAIP19({ chain, network })
  return { [caip19]: 'cosmos' }
}

export const makeOsmosisData = () => {
  const chain = ChainTypes.Osmosis
  const network = NetworkTypes.OSMOSIS_MAINNET
  const caip19 = toCAIP19({ chain, network })
  return { [caip19]: 'osmosis' }
}

export const parseData = (d: CoinCapCoin[]) => {
  const ethereumMainnet = toCAIP2({ chain: ChainTypes.Ethereum, network: NetworkTypes.MAINNET })
  const bitcoinMainnet = toCAIP2({ chain: ChainTypes.Bitcoin, network: NetworkTypes.MAINNET })
  const cosmosHubMainnet = toCAIP2({
    chain: ChainTypes.Cosmos,
    network: NetworkTypes.COSMOSHUB_MAINNET
  })
  const osmosisMainnet = toCAIP2({
    chain: ChainTypes.Osmosis,
    network: NetworkTypes.OSMOSIS_MAINNET
  })
  return {
    [ethereumMainnet]: parseEthData(d),
    [bitcoinMainnet]: makeBtcData(),
    [cosmosHubMainnet]: makeCosmosHubData(),
    [osmosisMainnet]: makeOsmosisData()
  }
}
