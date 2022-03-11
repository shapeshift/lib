import { AssetNamespace, caip19, WellKnownChain } from '@shapeshiftoss/caip'
import { AssetDataSource, TokenAsset } from '@shapeshiftoss/types'
import axios from 'axios'
import lodash from 'lodash'

import { tokensToOverride } from './overrides'

type UniswapToken = {
  chainId: number
  address: string
  name: string
  symbol: string
  decimals: number
  logoURI: string
}

type UniswapTokenData = {
  name: string
  logoURI: string
  keywords: string[]
  timestamp: string
  tokens: UniswapToken[]
}

export async function getUniswapTokens(): Promise<TokenAsset[]> {
  const { data: uniswapTokenData } = await axios.get<UniswapTokenData>(
    'https://tokens.coingecko.com/uniswap/all.json'
  )

  return uniswapTokenData.tokens.reduce<TokenAsset[]>((acc, token) => {
    const assetReference = token.address.toLowerCase()
    if (!assetReference) return acc // if no token address, we can't deal with this asset.

    const tokenAssetId = caip19.toCAIP19({
      chainId: WellKnownChain.EthereumMainnet,
      assetNamespace: AssetNamespace.ERC20,
      assetReference
    })
    const overrideToken: TokenAsset | undefined = lodash.find(
      tokensToOverride,
      (override: TokenAsset) => override.assetId === tokenAssetId
    )

    acc.push(
      overrideToken ?? {
        assetId: tokenAssetId,
        dataSource: AssetDataSource.CoinGecko,
        name: token.name,
        precision: token.decimals,
        color: '#FFFFFF', // TODO
        secondaryColor: '#FFFFFF', // TODO
        icon: token.logoURI,
        sendSupport: true,
        receiveSupport: true,
        symbol: token.symbol
      }
    )
    return acc
  }, [])
}
