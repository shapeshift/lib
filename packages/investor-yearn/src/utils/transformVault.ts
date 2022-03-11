import { WellKnownChain } from '@shapeshiftoss/caip'
import { Vault } from '@yfi/sdk'
import { toLower } from 'lodash'

import { bnOrZero, DefiProvider, DefiType, SupportedYearnVault } from '..'

export const transformVault = (vault: Vault): SupportedYearnVault => {
  return {
    ...vault,
    vaultAddress: toLower(vault.address),
    name: `${vault.name} ${vault.version}`,
    symbol: vault.symbol,
    tokenAddress: toLower(vault.token),
    chainId: WellKnownChain.EthereumMainnet,
    provider: DefiProvider.Yearn,
    type: DefiType.Vault,
    expired: vault.metadata.depositsDisabled || bnOrZero(vault.metadata.depositLimit).lte(0)
  }
}
