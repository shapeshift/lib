import axios from 'axios'
import fs from 'fs'

import { WellKnownChain } from '../../caip2/caip2'
import { AssetNamespace, toCAIP19, WellKnownAsset } from './../../caip19/caip19'

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
  console.info('Generated Osmosis CAIP19 adapter data.')
}

export const fetchData = async (URL: string) => (await axios.get<OsmosisCoin[]>(URL)).data

const parseIbcRegex = /^ibc\/([0-9A-F]{64})$/
export const parseOsmosisData = (data: OsmosisCoin[]) => {
  return data.reduce<Record<string, string>>((acc, { denom, symbol }) => {
    acc[
      (() => {
        if (denom === 'uosmo') return WellKnownAsset.OSMO
        const result = parseIbcRegex.exec(denom)
        if (result) {
          return toCAIP19({
            chainId: WellKnownChain.OsmosisMainnet,
            assetNamespace: AssetNamespace.IBC,
            assetReference: result[1]
          })
        } else if (denom.includes('/')) {
          throw new Error(`osmosis denom ${denom} not recognized`)
        } else {
          return toCAIP19({
            chainId: WellKnownChain.OsmosisMainnet,
            assetNamespace: AssetNamespace.NATIVE,
            assetReference: denom
          })
        }
      })()
    ] = symbol
    return acc
  }, {})
}

export const parseData = (d: OsmosisCoin[]) => ({
  [WellKnownChain.OsmosisMainnet]: parseOsmosisData(d)
})
