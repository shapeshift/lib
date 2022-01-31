import 'dotenv/config'

import { caip19 } from '@shapeshiftoss/caip'
import { BaseAsset, ChainTypes, NetworkTypes } from '@shapeshiftoss/types'
import fs from 'fs'
import uniqBy from 'lodash/uniqBy'

import { testUrl } from '../helpers/testUrl'
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
        // this will break after we support more than ~65096 assets
        // (hard limit of file descriptors in node) https://stackoverflow.com/a/17033757
        // batch the requests after that point
        const promises = uniqueTokens.map(async (token, idx) => {
          const { chain } = caip19.fromCAIP19(uniqueTokens[idx].caip19)
          const { info } = generateTrustWalletUrl({ chain, tokenId: token.tokenId })
          const result = await testUrl(info)
          console.info(`${idx + 1} of ${uniqueTokens.length}`, token.name, result)
          return result
        }) // beard fill in url
        const result = await Promise.allSettled(promises)
        const modifiedTokens = result.map((res, idx) => {
          if (res.status === 'rejected') {
            return uniqueTokens[idx] // token without modified icon
          } else {
            const { chain } = caip19.fromCAIP19(uniqueTokens[idx].caip19)
            const { icon } = generateTrustWalletUrl({ chain, tokenId: uniqueTokens[idx].tokenId })
            return { ...uniqueTokens[idx], icon }
          }
        })
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
