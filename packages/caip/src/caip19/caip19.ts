import { toCAIP2 } from './../caip2/caip2'
// https://github.com/ChainAgnostic/CAIPs/blob/master/CAIPs/caip-19.md

import { ChainTypes, ContractTypes, NetworkTypes } from '@shapeshiftoss/types'

export enum AssetNamespace {
  ERC20 = 'erc20',
  ERC721 = 'erc721',
  Slip44 = 'slip44'
}

export enum AssetReference {
  Bitcoin = 0,
  Ethereum = 60
}

type ToCAIP19Args = {
  chain: ChainTypes
  network: NetworkTypes
  contractType?: ContractTypes
  tokenId?: string
}

export const toCAIP19 = ({ chain, network, contractType, tokenId }: ToCAIP19Args): string => {
  const caip2 = toCAIP2({ chain, network })

  switch (chain) {
    case ChainTypes.Ethereum: {
      if (tokenId) {
        const shapeShiftToCAIP19Namespace = {
          [ChainTypes.Ethereum]: {
            [ContractTypes.ERC20]: AssetNamespace.ERC20,
            [ContractTypes.ERC721]: AssetNamespace.ERC721
          }
        } as const
        switch (contractType) {
          case ContractTypes.ERC20:
          case ContractTypes.ERC721: {
            const namespace = shapeShiftToCAIP19Namespace[chain][contractType]
            return `${caip2}/${namespace}:${tokenId}`
          }
          default: {
            throw new Error(`unsupported contractType ${contractType} on chain ${chain}`)
          }
        }
      } else {
        return `${caip2}/${AssetNamespace.Slip44}:${AssetReference.Ethereum}`
      }
      break
    }
    case ChainTypes.Bitcoin: {
      return `${caip2}/${AssetNamespace.Slip44}:${AssetReference.Bitcoin}`
    }
  }
}

export const CAIP19 = { AssetNamespace }
