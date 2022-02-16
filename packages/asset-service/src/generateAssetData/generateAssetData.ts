import 'dotenv/config'

import fs from 'fs'

import { atom, bitcoin, tBitcoin, tEthereum } from './baseAssets'
import { getOsmosisAssets } from './cosmos/getOsmosisAssets'
import { addTokensToEth } from './ethTokens'

const generateAssetData = async () => {
  const ethereum = await addTokensToEth()
  const osmosisAssets = await getOsmosisAssets()

  const generatedAssetData = [bitcoin, tBitcoin, ethereum, tEthereum, atom, ...osmosisAssets]

  await fs.promises.writeFile(
    `./src/service/generatedAssetData.json`,
    JSON.stringify(generatedAssetData)
  )
}

generateAssetData()
  .then(() => {
    console.info('done')
  })
  .catch((err) => console.info(err))
