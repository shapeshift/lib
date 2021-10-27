import axios from 'axios'
import fs from 'fs'

import { ChainTypes, ContractTypes, NetworkTypes } from '@shapeshiftoss/types'
import { toCAIP19 } from './../../caip19/caip19'

type CoingeckoCoin = {
  id: string
  symbol: string
  name: string
  platforms: {
    [k: string]: string
  }
}

const main = async () => {
  const coingeckoCoinsURL = 'https://api.coingecko.com/api/v3/coins/list?include_platform=true'
  const { data } = await axios.get<CoingeckoCoin[]>(coingeckoCoinsURL)
  const ethCoins = data.filter(
    ({ id, platforms }) => Boolean(platforms?.ethereum) || id === 'ethereum'
  )

  const chain = ChainTypes.Ethereum
  const network = NetworkTypes.MAINNET
  const contractType = ContractTypes.ERC20

  const [coingeckoEthereumToCAIP19, CAIP19toCoingeckoEthereum] = ethCoins.reduce(
    ([frogToCape, capeToFrog], coin) => {
      const { id, platforms } = coin
      const tokenId = platforms?.ethereum
      let caip19
      if (tokenId) {
        caip19 = toCAIP19({ chain, network, contractType, tokenId })
      } else {
        caip19 = toCAIP19({ chain, network })
      }
      frogToCape[id] = caip19
      capeToFrog[caip19] = id
      return [frogToCape, capeToFrog]
    },
    [{}, {}] as Array<Record<string, string>>
  )

  console.info(coingeckoEthereumToCAIP19)
  console.info(CAIP19toCoingeckoEthereum)

  const btcMainnet = 'bip122:000000000019d6689c085ae165831e93/slip44:0'

  const CAIP19toCoingeckoBitcoin = {
    [btcMainnet]: 'bitcoin' // we can pretttty safely hardcode this one
  }

  const coingeckoBitcoinToCAIP19 = {
    bitcoin: btcMainnet
  }

  await fs.promises.writeFile(
    `./src/adapters/coingecko/generated/eip155:1/coingeckoToCAIP19Map.json`,
    JSON.stringify(coingeckoEthereumToCAIP19)
  )

  await fs.promises.writeFile(
    `./src/adapters/coingecko/generated/eip155:1/CAIP19ToCoingeckoMap.json`,
    JSON.stringify(CAIP19toCoingeckoEthereum)
  )

  await fs.promises.writeFile(
    `./src/adapters/coingecko/generated/bip122:000000000019d6689c085ae165831e93/coingeckoToCAIP19Map.json`,
    JSON.stringify(coingeckoBitcoinToCAIP19)
  )

  await fs.promises.writeFile(
    `./src/adapters/coingecko/generated/bip122:000000000019d6689c085ae165831e93/CAIP19ToCoingeckoMap.json`,
    JSON.stringify(CAIP19toCoingeckoBitcoin)
  )
}

main().then(() => console.info('Generated Coingecko CAIP19 adapter data.'))
