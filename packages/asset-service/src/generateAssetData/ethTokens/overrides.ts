import { assetService, ContractTypes } from '@shapeshiftoss/types'

export const tokensToOverride: Array<assetService.Token> = [
  // example overriding FOX token with custom values instead of goingecko
  {
    name: 'Fox',
    precision: 18,
    tokenId: '0xc770eefad204b5180df6a14ee197d99d808ee52d',
    contractType: ContractTypes.ERC20,
    color: '#FFFFFF',
    secondaryColor: '#FFFFFF',
    icon: 'https://assets.coincap.io/assets/icons/fox@2x.png',
    sendSupport: true,
    receiveSupport: true,
    symbol: 'FOX'
  }
]
