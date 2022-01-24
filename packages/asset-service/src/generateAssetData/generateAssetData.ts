import { BaseAsset, ChainTypes, NetworkTypes } from '@shapeshiftoss/types'
import fs from 'fs'

import { baseAssets } from './baseAssets'
import { getTokens } from './ethTokens'
import { getIronBankTokens, getYearnVaults } from './ethTokens/yearnErc20'

const generateAssetData = async () => {
  const generatedAssetData = await Promise.all(
    baseAssets.map(async (baseAsset) => {
      if (baseAsset.chain === ChainTypes.Ethereum && baseAsset.network === NetworkTypes.MAINNET) {
        const [ethTokens, yearnVaults, ironBankTokens] = await Promise.all([
          await getTokens(),
          await getYearnVaults(),
          await getIronBankTokens()
        ])
        const baseAssetWithTokens: BaseAsset = {
          ...baseAsset,
          tokens: ethTokens.concat(yearnVaults).concat(ironBankTokens)
        }
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
}

generateAssetData().then(() => {
  console.info('done')
})
