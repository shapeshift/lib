import { AssetId } from '@shapeshiftoss/caip'

import { Asset } from '../service/AssetService'

export const overrideAssets: Record<AssetId, Partial<Asset>> = {
  'eip155:1/erc20:0xc770eefad204b5180df6a14ee197d99d808ee52d': {
    name: 'Fox',
    color: '#3761F9',
    icon: 'https://assets.coincap.io/assets/icons/256/fox.png',
  },
  'eip155:1/erc20:0x8cd3bac9875b1945d1d3469947236d8971bf3174': {
    assetId: 'eip155:1/erc20:0x8cd3bac9875b1945d1d3469947236d8971bf3174',
    chainId: 'eip155:1',
    name: 'Cool',
    precision: 18,
    color: '#3761F9',
    icon: 'https://etherscan.io/token/images/coolcrypto2_28.png',
    symbol: 'COOL',
    explorer: 'https://etherscan.io',
    explorerAddressLink: 'https://etherscan.io/address/',
    explorerTxLink: 'https://etherscan.io/tx/',
  },
}
