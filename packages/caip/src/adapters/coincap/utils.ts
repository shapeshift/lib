import { ChainTypes, NetworkTypes } from '@shapeshiftoss/types'
import axios from 'axios'
import fs from 'fs'

import { ASSET_REFERENCE, toAssetId } from '../../assetId/assetId'
import { CHAIN_NAMESPACE, CHAIN_REFERENCE, toChainId } from '../../chainId/chainId'

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
  console.info('Generated CoinCap AssetId adapter data.')
}

export const fetchData = async (URL: string) =>
  (await axios.get<{ data: CoinCapCoin[] }>(URL)).data.data

export const parseEthData = (data: CoinCapCoin[]) => {
  const ethCoins = data.filter(
    ({ id, explorer }) =>
      (explorer && explorer.startsWith('https://etherscan.io/token/0x')) || id === 'ethereum'
  )

  return ethCoins.reduce((acc, { id, explorer }) => {
    const chainNamespace = CHAIN_NAMESPACE.Ethereum
    const chainReference = CHAIN_REFERENCE.EthereumMainnet
    let assetReference: string = ASSET_REFERENCE.Ethereum
    const assetNamespace = id === 'ethereum' ? 'slip44' : 'erc20'
    if (id !== 'ethereum' && explorer) {
      assetReference = explorer
        .replace('https://etherscan.io/token/', '')
        .split('#')[0]
        .split('?')[0]
    }
    const assetId = toAssetId({ chainNamespace, chainReference, assetNamespace, assetReference })
    acc[assetId] = id
    return acc
  }, {} as Record<string, string>)
}

export const makeBtcData = () => {
  const chainNamespace = CHAIN_NAMESPACE.Bitcoin
  const chainReference = CHAIN_REFERENCE.BitcoinMainnet
  const assetId = toAssetId({
    chainNamespace,
    chainReference,
    assetNamespace: 'slip44',
    assetReference: ASSET_REFERENCE.Bitcoin
  })
  return { [assetId]: 'bitcoin' }
}

export const makeCosmosHubData = () => {
  const chainNamespace = CHAIN_NAMESPACE.Cosmos
  const chainReference = CHAIN_REFERENCE.CosmosHubMainnet
  const assetId = toAssetId({
    chainNamespace,
    chainReference,
    assetNamespace: 'slip44',
    assetReference: ASSET_REFERENCE.Cosmos
  })
  return { [assetId]: 'cosmos' }
}

export const makeOsmosisData = () => {
  const chainNamespace = CHAIN_NAMESPACE.Cosmos
  const chainReference = CHAIN_REFERENCE.OsmosisMainnet
  const assetId = toAssetId({
    chainNamespace,
    chainReference,
    assetNamespace: 'slip44',
    assetReference: ASSET_REFERENCE.Osmosis
  })
  return { [assetId]: 'osmosis' }
}

export const parseData = (d: CoinCapCoin[]) => {
  const ethereumMainnet = toChainId({ chain: ChainTypes.Ethereum, network: NetworkTypes.MAINNET })
  const bitcoinMainnet = toChainId({ chain: ChainTypes.Bitcoin, network: NetworkTypes.MAINNET })
  const cosmosHubMainnet = toChainId({
    chain: ChainTypes.Cosmos,
    network: NetworkTypes.COSMOSHUB_MAINNET
  })
  const osmosisMainnet = toChainId({
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
