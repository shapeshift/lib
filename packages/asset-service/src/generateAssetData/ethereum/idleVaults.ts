import { ethChainId as chainId, toAssetId } from '@shapeshiftoss/caip'
import { IdleSdk, IdleVault } from '@shapeshiftoss/investor-idle'
import axios from 'axios'
import toLower from 'lodash/toLower'

import { Asset } from '../../service/AssetService'
import { ethereum } from '../baseAssets'
import { colorMap } from '../colorMap'

// const network = 1 // 1 for mainnet
// const provider = new JsonRpcProvider(process.env.ETHEREUM_NODE_URL)

const idleSdk = new IdleSdk()

const explorerData = {
  explorer: ethereum.explorer,
  explorerAddressLink: ethereum.explorerAddressLink,
  explorerTxLink: ethereum.explorerTxLink,
}

const getIdleVaults = async (): Promise<Asset[]> => {
  const alchemyApiKey = process.env.ALCHEMY_API_KEY
  const vaults: IdleVault[] = await idleSdk.getVaults()

  const parsedVaults = []
  for (const vault of vaults) {
    const alchemyUrl = `https://eth-mainnet.g.alchemy.com/v2/${alchemyApiKey}`
    const alchemyPayload = JSON.stringify({
      jsonrpc: '2.0',
      method: 'alchemy_getTokenMetadata',
      params: [vault.address],
      id: 42,
    })
    const { data: tokenMetadata } = await axios.post(alchemyUrl, alchemyPayload)
    const symbol = tokenMetadata?.result?.symbol ?? vault.tokenName // Alchemy XHRs might fail, you never know
    const assetId = toAssetId({ chainId, assetNamespace: 'erc20', assetReference: vault.address })
    const displayIcon = `https://raw.githubusercontent.com/Idle-Labs/idle-dashboard/master/public/images/tokens/${vault.tokenName}.svg`

    parsedVaults.push({
      color: colorMap[assetId] ?? '#FFFFFF',
      icon: displayIcon,
      name: vault.poolName,
      precision: Number(18),
      symbol,
      tokenId: toLower(vault.address),
      chainId,
      assetId,
      ...explorerData,
    })
  }

  return parsedVaults
}

const getUnderlyingVaultTokens = async (): Promise<Asset[]> => {
  const vaults: IdleVault[] = await idleSdk.getVaults()

  return vaults.map((vault: IdleVault) => {
    const assetId = toAssetId({
      chainId,
      assetNamespace: 'erc20',
      assetReference: vault.underlyingAddress,
    })

    return {
      ...explorerData,
      color: colorMap[assetId] ?? '#FFFFFF',
      icon: '',
      name: vault.tokenName,
      precision: Number(18),
      symbol: vault.tokenName,
      chainId,
      assetId,
    }
  })
}

export const getIdleTokens = async (): Promise<Asset[]> => {
  const [idleVaults, underlyingVaultTokens] = await Promise.all([
    getIdleVaults(),
    getUnderlyingVaultTokens(),
  ])

  return [...idleVaults, ...underlyingVaultTokens]
}
