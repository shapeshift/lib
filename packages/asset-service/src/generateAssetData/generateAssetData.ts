import fs from 'fs'
import { baseAssets } from './baseAssets'
import { getTokens } from './ethTokens'
import { BaseAsset, NetworkTypes } from '../types'
import { AssetService } from '../'

const generateAssetData = async () => {
  const generatedAssetData = await Promise.all(
    baseAssets.map(async (baseAsset) => {
      if (baseAsset.chain === 'ETH' && baseAsset.network === NetworkTypes.ETH_MAINNET) {
        const ethTokens = await getTokens()
        const baseAssetWithTokens: BaseAsset = { ...baseAsset, tokens: ethTokens }
        return baseAssetWithTokens
      } else {
        return baseAsset
      }
    })
  )

  await fs.promises.writeFile(
    `./src/service/generatedAssetData.json`,
    JSON.stringify(generatedAssetData)
  )

  const assetService = new AssetService('blah')

  await assetService.initialize()
  const assets = assetService.byNetwork(NetworkTypes.ETH_ROPSTEN)

  console.log('assets is', assets)
}

generateAssetData().then(() => {
  console.log('done')
})
