import { Asset, BaseAsset, ChainTypes, NetworkTypes } from '@shapeshiftoss/types'
import fs from 'fs'
import flatten from 'lodash/flatten'

import { baseAssets } from './baseAssets'
import { getTokens } from './ethTokens'
import { extendErc20 } from './extendErc20'

const generateAssetData = async () => {
  const generatedAssetData = await Promise.all(
    baseAssets.map(async (baseAsset) => {
      if (baseAsset.chain === ChainTypes.Ethereum && baseAsset.network === NetworkTypes.MAINNET) {
        const ethTokens = await getTokens()
        const baseAssetWithTokens: BaseAsset = { ...baseAsset, tokens: ethTokens }
        return baseAssetWithTokens
      } else {
        return baseAsset
      }
    })
  )

  const extendedERC20Tokens = await extendErc20()

  const ethereumAsset = generatedAssetData.find(
    (asset: Asset) => asset.caip19 === 'eip155:1/slip44:60'
  )
  if (ethereumAsset && extendedERC20Tokens?.length) {
    ethereumAsset.tokens = flatten([ethereumAsset.tokens ?? [], extendedERC20Tokens])
  }

  await fs.promises.writeFile(
    `./src/service/generatedAssetData.json`,
    JSON.stringify(generatedAssetData)
  )
}

generateAssetData().then(() => {
  console.info('done')
})
