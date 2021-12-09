import { ChainTypes, ContractTypes, NetworkTypes } from '@shapeshiftoss/types'
import axios from 'axios'
import fs from 'fs'

import { toCAIP2 } from '../../caip2/caip2'
import { toCAIP19 } from './../../caip19/caip19'

export type YearnVault = {
  id: string
  symbol: string
  name: string
  platforms: {
    [k: string]: string
  }
}

export const writeFiles = async (data: Record<string, Record<string, string>>) => {
  const path = './src/adapters/yearn/generated/'
  const file = '/adapter.json'
  const writeFile = async ([k, v]: [string, unknown]) =>
    await fs.promises.writeFile(`${path}${k}${file}`, JSON.stringify(v))
  await Promise.all(Object.entries(data).map(writeFile))
  console.info('Generated Yearn CAIP19 adapter data.')
}

export const fetchData = async (URL: string) => (await axios.get<YearnVault[]>(URL)).data

export const parseData = (data: YearnVault[]) => {
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

  return result
}

export const makeBtcData = () => {
  const chain = ChainTypes.Bitcoin
  const network = NetworkTypes.MAINNET
  const caip19 = toCAIP19({ chain, network })
  return { [caip19]: 'bitcoin' }
}
