import toLower from 'lodash/toLower'

import * as adapters from './generated'

export const coincapUrl = 'https://api.coincap.io/v2/assets?limit=2000'

const generatedCAIP19ToCoinCapMap = Object.values(adapters).reduce((acc, cur) => ({
  ...acc,
  ...cur
})) as Record<string, string>

const invert = <T extends Record<string, string>>(data: T) =>
  Object.entries(data).reduce((acc, [k, v]) => ((acc[v] = k), acc), {} as Record<string, string>)

const generatedCoinCapToCAIP19Map: Record<string, string> = invert(generatedCAIP19ToCoinCapMap)

export const coincapToCAIP19 = (id: string): string | undefined => generatedCoinCapToCAIP19Map[id]

export const caip19ToCoinCap = (caip19: string): string | undefined =>
  generatedCAIP19ToCoinCapMap[toLower(caip19)]
