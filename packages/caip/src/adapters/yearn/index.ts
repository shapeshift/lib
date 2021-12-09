import toLower from 'lodash/toLower'

import * as adapters from './generated'

export const url = 'https://api.yearn.finance/v1/chains/1/vaults/all'

const generatedCAIP19ToYearnMap = Object.values(adapters).reduce((acc, cur) => ({
  ...acc,
  ...cur
})) as Record<string, string>

const invert = <T extends Record<string, string>>(data: T) =>
  Object.entries(data).reduce((acc, [k, v]) => ((acc[v] = k), acc), {} as Record<string, string>)

const generatedYearnToCAIP19Map: Record<string, string> = invert(generatedCAIP19ToYearnMap)

export const yearnToCAIP19 = (id: string): string => {
  const generated = generatedYearnToCAIP19Map[id]
  if (!generated) {
    throw new Error(`yearnToCAIP19: no caip19 found for id ${id}`)
  }
  return generated
}

export const CAIP19ToYearn = (caip19: string): string => {
  const generated = generatedCAIP19ToYearnMap[toLower(caip19)]
  if (!generated) {
    throw new Error(`CAIP19ToYearn: no id found for caip19 ${toLower(caip19)}`)
  }
  return generated
}
