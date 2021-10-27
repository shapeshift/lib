import invert from 'lodash/invert'

import * as adapters from './generated'

const CAIP19ToCoingeckoMap = Object.values(adapters).reduce((acc, cur) => ({ ...acc, ...cur }))
const coingeckoToCAIP19Map = invert(CAIP19ToCoingeckoMap)

type CoingeckoCAIP19s = keyof typeof CAIP19ToCoingeckoMap
const coingeckoToCAIP19 = (id: CoingeckoCAIP19s): string => coingeckoToCAIP19Map[id]
const CAIP19ToCoingecko = (caip19: CoingeckoCAIP19s): string => CAIP19ToCoingeckoMap[caip19]

export { CAIP19ToCoingecko, coingeckoToCAIP19 }
