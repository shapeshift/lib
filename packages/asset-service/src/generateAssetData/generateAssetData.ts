import { caip19 } from '@shapeshiftoss/caip'
import {
  Asset,
  BaseAsset,
  ChainTypes,
  ContractTypes,
  NetworkTypes,
  TokenAsset,
  YearnApiVault
} from '@shapeshiftoss/types'
import axios, { AxiosInstance, AxiosResponse } from 'axios'
import fs from 'fs'
import flatten from 'lodash/flatten'

import { baseAssets } from './baseAssets'
import { getTokens } from './ethTokens'

const yearnAxios: AxiosInstance = axios.create({
  baseURL: 'https://api.yearn.finance/v1'
})

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

  const response: AxiosResponse = await yearnAxios.get(`/chains/1/vaults/all`)
  const yearnVaults: YearnApiVault[] = response?.data as YearnApiVault[]
  const generatedYearnAssets: TokenAsset[] = yearnVaults.map((vault: YearnApiVault) => {
    if (!vault) return {} as TokenAsset
    return {
      color: '#FFFFFF',
      contractType: ContractTypes.ERC20,
      icon: vault.icon,
      name: vault.name,
      precision: vault.decimals,
      receiveSupport: true,
      secondaryColor: '#FFFFFF',
      sendSupport: true,
      symbol: vault.symbol,
      tokenId: vault.address,
      caip19: caip19.toCAIP19({
        chain: ChainTypes.Ethereum,
        network: NetworkTypes.MAINNET,
        tokenId: vault.address,
        contractType: ContractTypes.ERC20
      })
    } as TokenAsset
  })

  const ethereumAsset = generatedAssetData.find(
    (asset: Asset) => asset.caip19 === 'eip155:1/slip44:60'
  )
  if (ethereumAsset && generatedYearnAssets?.length) {
    ethereumAsset.tokens = flatten([ethereumAsset.tokens as TokenAsset[], generatedYearnAssets])
  }

  await fs.promises.writeFile(
    `./src/service/generatedAssetData.json`,
    JSON.stringify(generatedAssetData)
  )
}

generateAssetData().then(() => {
  console.info('done')
})
