import axios from 'axios'
import { ContractTypes, assetService } from '@shapeshiftoss/types'
import lodash from 'lodash'
import { tokensToOverride } from './overrides'

type CoingeckoTokenData = {
  address: string
  name: string
  symbol: string
  decimals: number
  logoURI: string
}

export async function getTokens(): Promise<Array<assetService.Token>> {
  const { data: uniswapTokenData } = await axios.get(
    'https://tokens.coingecko.com/uniswap/all.json'
  )

  const tokens = uniswapTokenData.tokens.map((token: CoingeckoTokenData) => {
    const overrideToken: assetService.Token | undefined = lodash.find(
      tokensToOverride,
      (override: assetService.Token) => override.tokenId === token.address
    )

    if (overrideToken) return overrideToken

    return {
      name: token.name,
      precision: token.decimals,
      tokenId: token.address.toLowerCase(),
      contractType: ContractTypes.ERC20,
      color: '#FFFFFF', // TODO
      secondaryColor: '#FFFFFF', // TODO
      icon: token.logoURI,
      explorer: 'https://etherscan.io',
      explorerTxLink: 'https://etherscan.io/tx/',
      sendSupport: true,
      receiveSupport: true,
      symbol: token.symbol
    }
  })

  return tokens
}
