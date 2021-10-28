import invert from 'lodash/invert'
import merge from 'lodash/merge'
import values from 'lodash/values'

import * as adapters from './generated'
import { fetchData, parseData } from './utils'

export const url = 'https://api.coingecko.com/api/v3/coins/list?include_platform=true'

const generatedCAIP19ToCoingeckoMap = Object.values(adapters).reduce((acc, cur) => ({
  ...acc,
  ...cur
})) as Record<string, string>

const generatedCoingeckoToCAIP19Map = invert(generatedCAIP19ToCoingeckoMap)

let currentCAIP19ToCoingeckoMap: Record<string, string> = {}
let currentCoingeckoToCAIP19Map: Record<string, string> = {}
let fetched = false

const fetchAndCacheCurrentData = async () => {
  if (fetched) return
  try {
    const data = await fetchData(url)
    const parsed = parseData(data)
    const CAIP19ToCoingeckoMap = merge(values(parsed))
    const coingeckoToCAIP19Map = invert(CAIP19ToCoingeckoMap)
    currentCAIP19ToCoingeckoMap = CAIP19ToCoingeckoMap
    currentCoingeckoToCAIP19Map = coingeckoToCAIP19Map
    fetched = true
  } catch (e) {
    console.error(`CAIP19 coingecko adapter: error fetching data from coingecko ${e}`)
  }
}

export const coingeckoToCAIP19 = async (id: string): Promise<string> => {
  // await fetchAndCacheCurrentData()
  const live = currentCoingeckoToCAIP19Map[id]
  const generated = generatedCoingeckoToCAIP19Map[id]
  if (live && !generated) {
    console.warn(
      `coingeckoToCAIP19: no static data available for ${id} - please run and commit generate script`
    )
  }
  return (live || generated) ?? ''
}

export const CAIP19ToCoingecko = async (
  caip19: keyof typeof generatedCoingeckoToCAIP19Map
): Promise<string> => {
  // await fetchAndCacheCurrentData()
  const live = currentCAIP19ToCoingeckoMap[caip19]
  const generated = generatedCAIP19ToCoingeckoMap[caip19]

  if (live && !generated) {
    console.warn(
      `CAIP19ToCoingecko: no static data available for ${caip19} - please run and commit generate script`
    )
  }
  return (live || generated) ?? ''
}
