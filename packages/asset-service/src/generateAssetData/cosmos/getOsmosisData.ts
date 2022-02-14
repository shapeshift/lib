import { Asset, AssetDataSource, ChainTypes, NetworkTypes } from '@shapeshiftoss/types'
import axios from 'axios'
import fs from 'fs'

type AssetList = {
  description: string
  denom_units: {
    denom: string
    exponent: number
    aliases: string[]
  }[]
  base: string
  name: string
  display: string
  symbol: string
  logo_URIs: {
    png: string
    svg: string
  },
  coingecko_id: string
}

type AssetListResponse = {
  chain_id: string
  assets: AssetList[]
}

export const getCosmosData = async (): Promise<Asset[]> => {
  const { data } = await axios.get<AssetListResponse>(
    'https://raw.githubusercontent.com/osmosis-labs/assetlists/main/osmosis-1/osmosis-1.assetlist.json'
  )

  // Development code only to view the response beautified in the editor.
  await fs.promises.writeFile(
    `./src/generateAssetData/cosmos/deleteme.json`,
    JSON.stringify(data, null, 2)
  )

  return data.assets.reduce<Asset[]>((acc, current) => {
    if (!current) return acc

    const denom = current.denom_units.find((item) => item.denom === current.display)
    const precision = denom?.exponent ?? 6

    acc.push({
      caip19: 'cosmos:osmosis-1/slip44:188:',
      caip2: 'cosmos:osmosis-1',
      chain: ChainTypes.Ethereum,
      dataSource: AssetDataSource.CoinGecko,
      network: NetworkTypes.MAINNET,
      symbol: current.symbol,
      name: current.name,
      precision,
      slip44: 60,
      color: '#FFFFFF',
      secondaryColor: '#FFFFFF',
      icon: current.logo_URIs.png,
      explorer: 'https://etherscan.io',
      explorerAddressLink: 'https://etherscan.io/address/',
      explorerTxLink: 'https://etherscan.io/tx/',
      sendSupport: true,
      receiveSupport: true
    })
    return acc
  }, [])
}
