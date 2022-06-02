import { ChainTypes } from '@shapeshiftoss/types'
import { Vault } from '@yfi/sdk'

import { transformVault } from '../utils'
import { yearnSdk } from './yearn-sdk'

export type SupportedYearnVault = Vault & {
  vaultAddress: string
  name: string
  symbol: string
  tokenAddress: string
  chain: ChainTypes
  provider: string
  type: string
  expired: boolean
}

export const getSupportedVaults = async (): Promise<SupportedYearnVault[]> => {
  const vaults = await yearnSdk.vaults.get()
  return vaults.map(transformVault)
}
