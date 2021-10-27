import CAIP19ToCoingeckoBitcoinMap from './generated/bip122:000000000019d6689c085ae165831e93/CAIP19ToCoingeckoMap.json'
import coingeckoBitcoinToCAIP19Map from './generated/bip122:000000000019d6689c085ae165831e93/coingeckoToCAIP19Map.json'
import CAIP19ToCoingeckoEthereumMap from './generated/eip155:1/CAIP19ToCoingeckoMap.json'
import coingeckoEthereumToCAIP19Map from './generated/eip155:1/coingeckoToCAIP19Map.json'

// the compiler is too smart here, and can infer the keys of the json
// it's not going to be ergonomic to expose these to the client, loosen it to string
const coingeckoToCAIP19Map: Record<string, string> = {
  ...coingeckoBitcoinToCAIP19Map,
  ...coingeckoEthereumToCAIP19Map
}
const CAIP19ToCoingeckoMap: Record<string, string> = {
  ...CAIP19ToCoingeckoBitcoinMap,
  ...CAIP19ToCoingeckoEthereumMap
}

export const coingeckoToCAIP19 = (id: string): string => {
  const caip19 = coingeckoToCAIP19Map[id]
  if (!caip19) {
    throw new Error(`coingeckoToCAIP19: no CAIP19 found for ${id}`)
  }
  return caip19
}

export const CAIP19toCoingecko = (caip19: string): string => {
  const id = CAIP19ToCoingeckoMap[caip19]
  if (!caip19) {
    throw new Error(`CAIP19toCoingecko: no id found for ${caip19}`)
  }
  return id
}
