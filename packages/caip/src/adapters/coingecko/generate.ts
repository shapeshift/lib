import fs from 'fs'

import { url } from './index'
import { fetchData, parseData } from './utils'

const writeFiles = async (data: Record<string, string>) => {
  const path = './src/adapters/coingecko/generated/'
  const file = '/adapter.json'
  const writeFile = async ([k, v]: string[]) => await fs.promises.writeFile(`${path}${k}${file}`, v)
  await Promise.all(Object.entries(data).map(writeFile))
  console.info('Generated CoinGecko CAIP19 adapter data.')
}

const main = async () => {
  const data = await fetchData(url)
  const output = parseData(data)
  await writeFiles(output)
}

main()
