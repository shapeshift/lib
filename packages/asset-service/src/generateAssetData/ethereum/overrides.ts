import { Asset } from '../../service/AssetService'
import { ethereum } from '../baseAssets'

export const overrideTokens: Asset[] = [
  // example overriding FOX token with custom values instead of goingecko
  {
    assetId: 'eip155:1/erc20:0xc770eefad204b5180df6a14ee197d99d808ee52d',
    chainId: 'eip155:1',
    name: 'Fox',
    precision: 18,
    color: '#222E51',
    icon: 'https://assets.coincap.io/assets/icons/fox@2x.png',
    symbol: 'FOX',
    explorer: ethereum.explorer,
    explorerAddressLink: ethereum.explorerAddressLink,
    explorerTxLink: ethereum.explorerTxLink,
  },
  {
    explorer: 'https://etherscan.io',
    explorerAddressLink: 'https://etherscan.io/address/',
    explorerTxLink: 'https://etherscan.io/tx/',
    color: '#55AD96',
    icon: 'https://rawcdn.githack.com/trustwallet/assets/master/blockchains/ethereum/assets/0x1CDD2EaB61112697626F7b4bB0e23Da4FeBF7B7C/logo.png',
    name: 'USDTso Wormhole',
    precision: 6,
    symbol: 'USDTso',
    chainId: 'eip155:1',
    assetId: 'eip155:1/erc20:0x1cdd2eab61112697626f7b4bb0e23da4febf7b7c',
  },
  {
    explorer: 'https://etherscan.io',
    explorerAddressLink: 'https://etherscan.io/address/',
    explorerTxLink: 'https://etherscan.io/tx/',
    color: '#55AC94',
    icon: 'https://rawcdn.githack.com/trustwallet/assets/master/blockchains/ethereum/assets/0xDe60aDfDdAAbaAAC3dAFa57B26AcC91Cb63728c4/logo.png',
    name: 'USDTbs Wormhole',
    precision: 18,
    symbol: 'USDTbs',
    chainId: 'eip155:1',
    assetId: 'eip155:1/erc20:0xde60adfddaabaaac3dafa57b26acc91cb63728c4',
  },
]
