import fs from 'fs'

import { findAll } from '..'

const generateMarketCapData = async () => {
  const marketCapData = await findAll()
  await fs.promises.writeFile(
    `./src/coincap/cachedMarketCapData.json`,
    JSON.stringify(marketCapData)
  )
  console.info('Generated Coincap market cap data.')
}

generateMarketCapData()
