import { AssetNamespace, CAIP19, caip19, WellKnownAsset, WellKnownChain } from '@shapeshiftoss/caip'
import Web3 from 'web3'

export const generateTrustWalletUrl = (assetId: CAIP19) => {
  const url = `https://rawcdn.githack.com/trustwallet/assets/master/blockchains/${(() => {
    switch (assetId) {
      case WellKnownAsset.BTC:
        return 'bitcoin'
      case WellKnownAsset.ETH:
        return 'ethereum'
      case WellKnownAsset.ATOM:
        return 'cosmos'
      case WellKnownAsset.OSMO:
        return 'osmosis'
      default: {
        const { chainId, assetNamespace, assetReference } = caip19.fromCAIP19(assetId)
        switch (chainId) {
          case WellKnownChain.EthereumMainnet: {
            switch (assetNamespace) {
              case AssetNamespace.ERC20:
                return `ethereum/assets/${Web3.utils.toChecksumAddress(assetReference)}`
            }
          }
        }
        throw new Error(`trustwallet doesn't support assetId ${assetId}`)
      }
    }
  })()}`

  return {
    info: `${url}/info.json`,
    icon: `${url}/logo.png`
  }
}
