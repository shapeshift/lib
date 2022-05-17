import { AssetNamespace, toAssetId, toChainId } from '@shapeshiftoss/caip'
import { AssetDataSource, ChainTypes, NetworkTypes, TokenAsset } from '@shapeshiftoss/types'

export const getUniswapV2Pools = (): TokenAsset[] => {
  const chain = ChainTypes.Ethereum
  const network = NetworkTypes.MAINNET
  const assetNamespace = AssetNamespace.ERC20
  const assetReference = '0x470e8de2ebaef52014a47cb5e6af86884947f08c' // UNI-V2 contract address

  const result: TokenAsset = {
    assetId: toAssetId({
      chain,
      network,
      assetNamespace,
      assetReference
    }),
    chainId: toChainId({ chain, network }),
    dataSource: AssetDataSource.CoinGecko,
    name: 'Uniswap V2 - FOX/WETH',
    precision: 18,
    tokenId: assetReference,
    contractType: assetNamespace,
    color: '#FFFFFF',
    secondaryColor: '#FFFFFF',
    icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
    sendSupport: true,
    receiveSupport: true,
    symbol: 'ETH/FOX'
  }

  return [result]
}
