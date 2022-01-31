import 'dotenv/config'

import { caip19 } from '@shapeshiftoss/caip'
import { BaseAsset, ChainTypes, NetworkTypes, TokenAsset } from '@shapeshiftoss/types'
import axios from 'axios'
import fs from 'fs'
import { chunk } from 'lodash'
import uniqBy from 'lodash/uniqBy'

import { generateTrustWalletUrl } from '../service/TrustWalletService'
import { baseAssets } from './baseAssets'
import { getTokens } from './ethTokens'
import {
  getIronBankTokens,
  getUnderlyingVaultTokens,
  getYearnVaults,
  getZapperTokens
} from './ethTokens/extendErc20'

const generateAssetData = async () => {
  const generatedAssetData = await Promise.all(
    baseAssets.map(async (baseAsset) => {
      if (baseAsset.chain === ChainTypes.Ethereum && baseAsset.network === NetworkTypes.MAINNET) {
        const [
          ethTokens,
          yearnVaults,
          ironBankTokens,
          zapperTokens,
          underlyingTokens
        ] = await Promise.all([
          await getTokens(),
          await getYearnVaults(),
          await getIronBankTokens(),
          await getZapperTokens(),
          await getUnderlyingVaultTokens()
        ])
        const tokens = [
          ...ethTokens,
          ...yearnVaults,
          ...ironBankTokens,
          ...zapperTokens,
          ...underlyingTokens
        ]
        const uniqueTokens = uniqBy(tokens, 'caip19') // Remove dups
        const batchSize = 100 // tune this to keep rate limiting happy
        const tokenBatches = chunk(uniqueTokens, batchSize)
        const modifiedTokens: TokenAsset[] = []
        for (const [i, batch] of tokenBatches.entries()) {
          console.info(`processing batch ${i + 1} of ${tokenBatches.length}`)
          const promises = batch.map(async (token, idx) => {
            const { chain } = caip19.fromCAIP19(uniqueTokens[idx].caip19)
            const { info } = generateTrustWalletUrl({ chain, tokenId: token.tokenId })
            return axios.head(info) // return promise
          })
          console.info('we have promises')
          const result = await Promise.allSettled(promises)
          console.info('all settled')
          const newModifiedTokens = result.map((res, idx) => {
            if (res.status === 'rejected') {
              console.info('no change')
              return uniqueTokens[idx] // token without modified icon
            } else {
              console.info(
                `new icon for ${idx * batchSize + 1} of ${uniqueTokens.length}`,
                uniqueTokens[idx].name
              )
              const { chain } = caip19.fromCAIP19(uniqueTokens[idx].caip19)
              const { icon } = generateTrustWalletUrl({ chain, tokenId: uniqueTokens[idx].tokenId })
              return { ...uniqueTokens[idx], icon }
            }
          })
          modifiedTokens.concat(newModifiedTokens)
        }
        const baseAssetWithTokens: BaseAsset = {
          ...baseAsset,
          tokens: modifiedTokens
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

generateAssetData()
  .then(() => {
    console.info('done')
  })
  .catch((err) => console.info(err))
