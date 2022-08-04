import { IdleSdk, IdleVault } from '@shapeshiftoss/investor-idle'
import fs from 'fs'
import toLower from 'lodash/toLower'
import uniqBy from 'lodash/uniqBy'

import { toAssetId } from '../../assetId/assetId'
import { toChainId } from '../../chainId/chainId'
import { CHAIN_NAMESPACE, CHAIN_REFERENCE } from '../../constants'

const idleSdk = new IdleSdk()

export const writeFiles = async (data: Record<string, Record<string, string>>) => {
  const path = './src/adapters/idle/generated/'
  const file = '/adapter.json'
  const writeFile = async ([k, v]: [string, unknown]) =>
    await fs.promises.writeFile(`${path}${k}${file}`.replace(':', '_'), JSON.stringify(v))
  await Promise.all(Object.entries(data).map(writeFile))
  console.info('Generated Idle AssetId adapter data.')
}

export const fetchData = async () => {
  const idleTokens = await idleSdk.getVaults()
  const tokens = [...idleTokens]
  return uniqBy(tokens, 'address')
}

export const parseEthData = (data: (IdleVault)[]) => {
  const assetNamespace = 'erc20'
  const chainNamespace = CHAIN_NAMESPACE.Ethereum
  const chainReference = CHAIN_REFERENCE.EthereumMainnet

  return data.reduce((acc, datum) => {
    const { address } = datum
    const id = address
    const assetReference = toLower(address)
    const assetId = toAssetId({
      chainNamespace,
      chainReference,
      assetNamespace,
      assetReference
    })
    acc[assetId] = id
    return acc
  }, {} as Record<string, string>)
}

export const parseData = (d: (IdleVault)[]) => {
  const ethMainnet = toChainId({
    chainNamespace: CHAIN_NAMESPACE.Ethereum,
    chainReference: CHAIN_REFERENCE.EthereumMainnet
  })
  return { [ethMainnet]: parseEthData(d) }
}
