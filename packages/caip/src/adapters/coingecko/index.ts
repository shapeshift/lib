import invert from 'lodash/invert'

import * as adapters from './generated'

const CAIP19ToCoingeckoMap = Object.values(adapters).reduce((acc, cur) => ({
  ...acc,
  ...cur
})) as Record<string, string>
const coingeckoToCAIP19Map = invert(CAIP19ToCoingeckoMap)

const coingeckoToCAIP19 = (id: string): string => coingeckoToCAIP19Map[id]
const CAIP19ToCoingecko = (caip19: string): string => CAIP19ToCoingeckoMap[caip19]

export { CAIP19ToCoingecko, coingeckoToCAIP19 }
