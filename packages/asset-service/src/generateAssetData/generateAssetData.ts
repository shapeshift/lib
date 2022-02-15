import 'dotenv/config'

import { ChainTypes, NetworkTypes } from '@shapeshiftoss/types'
import fs from 'fs'

import { bitcoin, tBitcoin, tEthereum } from './baseAssets'
import { getCosmosData } from './cosmos/getOsmosisData'
import { addTokensToEth } from './ethTokens'

const generateAssetData = async () => {
  const ethereum = await addTokensToEth()
  const osmosis = await getCosmosData()

  const generatedAssetData = [bitcoin, tBitcoin, ethereum, tEthereum, osmosis]

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
