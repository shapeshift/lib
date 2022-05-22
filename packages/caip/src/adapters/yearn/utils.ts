import { JsonRpcProvider } from '@ethersproject/providers'
import { ChainTypes, NetworkTypes } from '@shapeshiftoss/types'
import { Token, Vault, Yearn } from '@yfi/sdk'
import fs from 'fs'
import toLower from 'lodash/toLower'
import uniqBy from 'lodash/uniqBy'

import { toAssetId } from '../../assetId/assetId'
import { CHAIN_NAMESPACE, CHAIN_REFERENCE, toChainId } from '../../chainId/chainId'

const network = 1 // 1 for mainnet
const provider = new JsonRpcProvider(process.env.REACT_APP_ETHEREUM_NODE_URL)
const yearnSdk = new Yearn(network, { provider })

export const writeFiles = async (data: Record<string, Record<string, string>>) => {
  const path = './src/adapters/yearn/generated/'
  const file = '/adapter.json'
  const writeFile = async ([k, v]: [string, unknown]) =>
    await fs.promises.writeFile(`${path}${k}${file}`.replace(':', '_'), JSON.stringify(v))
  await Promise.all(Object.entries(data).map(writeFile))
  console.info('Generated Yearn AssetId adapter data.')
}

export const fetchData = async () => {
  const [vaults, ironBankTokens, zapperTokens, underlyingVaultTokens] = await Promise.all([
    yearnSdk.vaults.get(),
    yearnSdk.ironBank.tokens(),
    yearnSdk.tokens.supported(),
    yearnSdk.vaults.tokens()
  ])
  const tokens = [...vaults, ...ironBankTokens, ...zapperTokens, ...underlyingVaultTokens]
  return uniqBy(tokens, 'address')
}

export const parseEthData = (data: (Token | Vault)[]) => {
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

export const parseData = (d: (Token | Vault)[]) => {
  const ethMainnet = toChainId({ chain: ChainTypes.Ethereum, network: NetworkTypes.MAINNET })
  return { [ethMainnet]: parseEthData(d) }
}
