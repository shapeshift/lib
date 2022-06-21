import 'dotenv/config'

import { AssetId } from '@shapeshiftoss/caip'
import { Asset } from '@shapeshiftoss/types'
import fs from 'fs'
import orderBy from 'lodash/orderBy'

import { atom, bitcoin, tBitcoin } from './baseAssets'
import { getOsmosisAssets } from './cosmos/getOsmosisAssets'
import { addTokensToEth } from './ethTokens'
import { setColors } from './setColors'
import { filterOutBlacklistedAssets } from './utils'

// Getting the colors for ~6000 assets can take around 20 min from scratch. So we use this file to
// generate a color map so the generate asset script itself won't take so long.
const generateColorMap = async () => {
  const ethAssets = await addTokensToEth()
  const osmosisAssets = await getOsmosisAssets()

  // all assets, included assets to be blacklisted
  const unfilteredAssetData: Asset[] = [bitcoin, tBitcoin, ...ethAssets, atom, ...osmosisAssets]
  // remove blacklisted assets
  const filteredAssetData = filterOutBlacklistedAssets(unfilteredAssetData)

  const filteredWithColors = await setColors(filteredAssetData)

  // deterministic order so diffs are readable
  const orderedAssetList = orderBy(filteredWithColors, 'assetId')
  const initial: Record<AssetId, string> = {}
  const colorMap = orderedAssetList.reduce((acc, asset) => {
    const { assetId, color } = asset
    // Leave white out of the color map.
    if (color === '#FFFFFF') return acc
    acc[assetId] = color
    return acc
  }, initial)

  await fs.promises.writeFile(
    `./src/generateAssetData/colorMap/color-map.json`,
    // beautify the file for github diff.
    JSON.stringify(colorMap, null, 2)
  )
}

generateColorMap()
  .then(() => {
    console.info('done')
  })
  .catch((err) => console.info(err))
