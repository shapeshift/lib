import { AssetNamespace, toCAIP2, toCAIP19 } from '@shapeshiftoss/caip'
import { AssetDataSource, ChainTypes, NetworkTypes, TokenAsset } from '@shapeshiftoss/types'

export const getUniV2Token = (): TokenAsset[] => {
  const chain = ChainTypes.Ethereum
  const network = NetworkTypes.MAINNET
  const assetNamespace = AssetNamespace.ERC20
  const assetReference = '0x470e8de2ebaef52014a47cb5e6af86884947f08c' // FOXy contract address

  const result: TokenAsset = {
    assetId: toCAIP19({
      chain,
      network,
      assetNamespace,
      assetReference
    }),
    chainId: toCAIP2({ chain, network }),
    dataSource: AssetDataSource.CoinGecko,
    name: 'Uniswap ETH/FOX LP',
    precision: 18,
    tokenId: assetReference,
    contractType: assetNamespace,
    color: '#CCCCCC',
    secondaryColor: '#CCCCCC',
    icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
    sendSupport: true,
    receiveSupport: true,
    symbol: 'ETH/FOX'
  }

  return [result]
}
