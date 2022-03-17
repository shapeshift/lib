import { AssetNamespace, caip2, caip19 } from '@shapeshiftoss/caip'
import { AssetDataSource, ChainTypes, NetworkTypes, TokenAsset } from '@shapeshiftoss/types'

export const getFoxyToken = (): TokenAsset[] => {
  const chain = ChainTypes.Ethereum
  const network = NetworkTypes.MAINNET
  const assetNamespace = AssetNamespace.ERC20
  const assetReference = '0x61FcaBB591d63D00E897A67C64658D376FeAd816' // FOXy contract address

  const result: TokenAsset = {
    caip19: caip19.toCAIP19({
      chain,
      network,
      assetNamespace,
      assetReference
    }),
    caip2: caip2.toCAIP2({ chain, network }),
    dataSource: AssetDataSource.CoinGecko,
    name: 'FOXy',
    precision: 18,
    tokenId: assetReference,
    contractType: assetNamespace,
    color: '#CE3885',
    secondaryColor: '#CE3885',
    icon: 'https://i.ibb.co/r6RFnBv/foxy-icon.png',
    sendSupport: true,
    receiveSupport: true,
    symbol: 'FOXY'
  }

  return [result]
}
