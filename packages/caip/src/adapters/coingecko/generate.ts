import { ChainTypes, ContractTypes, NetworkTypes } from '@shapeshiftoss/types'
import axios from 'axios'
import fs from 'fs'

import { toCAIP2 } from './../../caip2/caip2'
import { toCAIP19 } from './../../caip19/caip19'

type CoingeckoCoin = {
  id: string
  symbol: string
  name: string
  platforms: {
    [k: string]: string
  }
}

const fetchData = async () => {
  const coingeckoCoinsURL = 'https://api.coingecko.com/api/v3/coins/list?include_platform=true'
  const { data } = await axios.get<CoingeckoCoin[]>(coingeckoCoinsURL)
  return data
}

const parseEthData = (data: CoingeckoCoin[]) => {
  const ethCoins = data.filter(
    ({ id, platforms }) => Boolean(platforms?.ethereum) || id === 'ethereum'
  )

  const chain = ChainTypes.Ethereum
  const network = NetworkTypes.MAINNET
  const contractType = ContractTypes.ERC20

  const result = ethCoins.reduce((acc, { id, platforms }) => {
    const tokenId = platforms?.ethereum
    const caip19 = toCAIP19({ chain, network, ...(tokenId ? { contractType, tokenId } : {}) })
    acc[caip19] = id
    return acc
  }, {} as Record<string, string>)

  return JSON.stringify(result)
}

const parseBtcData = (data: CoingeckoCoin[]) =>
  JSON.stringify(data.find(({ id }) => id === 'bitcoin'))

const writeFiles = async (data: Record<string, string>) => {
  const path = './src/adapters/coingecko/generated/'
  const file = '/adapter.json'
  const writeFile = async ([k, v]: string[]) => await fs.promises.writeFile(`${path}${k}${file}`, v)
  await Promise.all(Object.entries(data).map(writeFile))
  console.info('Generated CoinGecko CAIP19 adapter data.')
}

const main = async () => {
  const data = await fetchData()
  const ethMainnet = toCAIP2({ chain: ChainTypes.Ethereum, network: NetworkTypes.MAINNET })
  const btcMainnet = toCAIP2({ chain: ChainTypes.Bitcoin, network: NetworkTypes.MAINNET })
  const output = { [ethMainnet]: parseEthData(data), [btcMainnet]: parseBtcData(data) }
  await writeFiles(output)
}

main()
