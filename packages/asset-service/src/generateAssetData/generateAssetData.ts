import 'dotenv/config'

import { AssetId } from '@shapeshiftoss/caip'
import { Asset } from '@shapeshiftoss/types'
import fs from 'fs'
import orderBy from 'lodash/orderBy'

import { AssetsById } from '../service/AssetService'
import { atom, bitcoin, tBitcoin } from './baseAssets'
import { getOsmosisAssets } from './cosmos/getOsmosisAssets'
import { addTokensToEth } from './ethTokens'
import { setColors } from './setColors'
import { filterOutBlacklistedAssets } from './utils'

const generateAssetData = async () => {
  const ethAssets = await addTokensToEth()
  const osmosisAssets = await getOsmosisAssets()

  // all assets, included assets to be blacklisted
  const unfilteredAssetData: Asset[] = [bitcoin, tBitcoin, ...ethAssets, atom, ...osmosisAssets]
  // remove blacklisted assets
  const filteredAssetData = filterOutBlacklistedAssets(unfilteredAssetData)

  // For coins not currently in the color map, check to see if we can generate a color from the icon
  const filteredWithColors = await setColors(filteredAssetData)

  // deterministic order so diffs are readable
  const orderedAssetList = orderBy(filteredWithColors, 'assetId')
  const initial: Record<AssetId, Asset> = {}
  const generatedAssetData: AssetsById = orderedAssetList.reduce((acc, asset) => {
    const { assetId } = asset
    acc[assetId] = asset
    return acc
  }, initial)

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
