import { ChainTypes } from '@shapeshiftoss/types'
import Web3 from 'web3'

type TrustWalletServiceProps = {
  chain: ChainTypes
  tokenId: string
}
export const generateTrustWalletUrl = ({ chain, tokenId }: TrustWalletServiceProps) => {
  let address = tokenId
  switch (chain) {
    case ChainTypes.Ethereum:
      address = Web3.utils.toChecksumAddress(tokenId)
      break
  }
  return {
    info: `https://rawcdn.githack.com/trustwallet/assets/master/blockchains/${chain}/assets/${address}/info.json`,
    icon: `https://rawcdn.githack.com/trustwallet/assets/master/blockchains/${chain}/assets/${address}/logo.png`
  }
}
