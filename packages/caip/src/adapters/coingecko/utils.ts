import { ChainTypes, ContractTypes, NetworkTypes } from '@shapeshiftoss/types'
import axios from 'axios'

import { toCAIP2 } from '../../caip2/caip2'
import { toCAIP19 } from './../../caip19/caip19'

export type CoingeckoCoin = {
  id: string
  symbol: string
  name: string
  platforms: {
    [k: string]: string
  }
}

export const fetchData = async (URL: string) => (await axios.get<CoingeckoCoin[]>(URL)).data

export const parseEthData = (data: CoingeckoCoin[]) => {
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

export const parseBtcData = (data: CoingeckoCoin[]) => {
  const chain = ChainTypes.Bitcoin
  const network = NetworkTypes.MAINNET
  const caip19 = toCAIP19({ chain, network })
  const btc = data.find(({ id }) => id === 'bitcoin')
  const result = JSON.stringify({ [caip19]: btc?.id })
  return result
}

export const parseData = (d: CoingeckoCoin[]) => {
  const ethMainnet = toCAIP2({ chain: ChainTypes.Ethereum, network: NetworkTypes.MAINNET })
  const btcMainnet = toCAIP2({ chain: ChainTypes.Bitcoin, network: NetworkTypes.MAINNET })
  return { [ethMainnet]: parseEthData(d), [btcMainnet]: parseBtcData(d) }
}
