import 'dotenv/config'

import fs from 'fs'

import { atom, bitcoin, tBitcoin, tEthereum } from './baseAssets'
import { getOsmosisAssets } from './cosmos/getOsmosisAssets'
import { addTokensToEth } from './ethTokens'

const blacklistedAssets: string[] = blacklist

export const filterBlacklistedAssets = <T extends BaseAsset | TokenAsset>(assets: T[]) => {
  const isBaseAsset = (asset: BaseAsset | TokenAsset): asset is BaseAsset =>
    Boolean((asset as BaseAsset)?.tokens)

  const filteredAssets = filter(assets, (token) => {
    if (isBaseAsset(token) && token.tokens) {
      token.tokens = filterBlacklistedAssets(token.tokens)
    }

    return !blacklistedAssets.includes(token.caip19)
  })

  return filteredAssets
}

const generateAssetData = async () => {
  const ethereum = await addTokensToEth()
  const osmosisAssets = await getOsmosisAssets()

  const generatedAssetData = [bitcoin, tBitcoin, ethereum, tEthereum, atom, ...osmosisAssets]

  const filteredAssetData = filterBlacklistedAssets(generatedAssetData)

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
