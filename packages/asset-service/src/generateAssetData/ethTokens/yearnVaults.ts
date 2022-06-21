import { ethChainId as chainId, toAssetId } from '@shapeshiftoss/caip'
import { Asset } from '@shapeshiftoss/types'
import { Token, Vault } from '@yfi/sdk'
import toLower from 'lodash/toLower'

import { colorMap } from '../colorMap'
import { yearnSdk } from './yearnSdk'

export const getYearnVaults = async (): Promise<Asset[]> => {
  const vaults: Vault[] = await yearnSdk.vaults.get()

  return vaults.map((vault: Vault) => {
    const assetId = toAssetId({ chainId, assetNamespace: 'erc20', assetReference: vault.address })
    return {
      color: colorMap[assetId] ?? '#FFFFFF',
      icon: vault.metadata.displayIcon,
      name: vault.name,
      precision: Number(vault.decimals),
      symbol: vault.symbol,
      tokenId: toLower(vault.address),
      chainId,
      assetId,
      explorer: 'https://etherscan.io',
      explorerAddressLink: 'https://etherscan.io/address/',
      explorerTxLink: 'https://etherscan.io/tx/'
    }
  })
}

export const getIronBankTokens = async (): Promise<Asset[]> => {
  const ironBankTokens: Token[] = await yearnSdk.ironBank.tokens()
  return ironBankTokens.map((token: Token) => {
    const assetId = toAssetId({ chainId, assetNamespace: 'erc20', assetReference: token.address })

    return {
      explorer: 'https://etherscan.io',
      explorerAddressLink: 'https://etherscan.io/address/',
      explorerTxLink: 'https://etherscan.io/tx/',
      color: colorMap[assetId] ?? '#FFFFFF',
      icon: token.icon ?? '',
      name: token.name,
      precision: Number(token.decimals),
      symbol: token.symbol,
      chainId,
      assetId
    }
  })
}

export const getZapperTokens = async (): Promise<Asset[]> => {
  const zapperTokens: Token[] = await yearnSdk.tokens.supported()
  return zapperTokens.map((token: Token) => {
    const assetId = toAssetId({ chainId, assetNamespace: 'erc20', assetReference: token.address })

    return {
      explorer: 'https://etherscan.io',
      explorerAddressLink: 'https://etherscan.io/address/',
      explorerTxLink: 'https://etherscan.io/tx/',
      color: colorMap[assetId] ?? '#FFFFFF',
      icon: token.icon ?? '',
      name: token.name,
      precision: Number(token.decimals),
      symbol: token.symbol,
      chainId,
      assetId
    }
  })
}

export const getUnderlyingVaultTokens = async (): Promise<Asset[]> => {
  const underlyingTokens: Token[] = await yearnSdk.vaults.tokens()
  return underlyingTokens.map((token: Token) => {
    const assetId = toAssetId({ chainId, assetNamespace: 'erc20', assetReference: token.address })

    return {
      explorer: 'https://etherscan.io',
      explorerAddressLink: 'https://etherscan.io/address/',
      explorerTxLink: 'https://etherscan.io/tx/',
      color: colorMap[assetId] ?? '#FFFFFF',
      icon: token.icon ?? '',
      name: token.name,
      precision: Number(token.decimals),
      symbol: token.symbol,
      chainId,
      assetId
    }
  })
}
