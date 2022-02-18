import 'dotenv/config'

import fs from 'fs'

import { atom, bitcoin, tBitcoin, tEthereum } from './baseAssets'
import blacklist from './blacklist.json'
import { getOsmosisAssets } from './cosmos/getOsmosisAssets'
import { addTokensToEth } from './ethTokens'
import { filterBlacklistedAssets } from './utils'

const generateAssetData = async () => {
  const ethereum = await addTokensToEth()
  const osmosisAssets = await getOsmosisAssets()

  const unfilteredAssetData = [bitcoin, tBitcoin, ethereum, tEthereum, atom, ...osmosisAssets]

  const generatedAssetData = filterBlacklistedAssets(blacklist, unfilteredAssetData)

  await fs.promises.writeFile(
    `./src/service/generatedAssetData.json`,
    // beautify the file for github diff.
    JSON.stringify(generatedAssetData, null, 2)
  )
}

generateAssetData()
  .then(() => {
    console.info('done')
  })
  .catch((err) => console.info(err))
