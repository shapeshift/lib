import { ChainId } from '@shapeshiftoss/caip'
import { chainIdToChainLabel } from '@shapeshiftoss/chain-adapters'
import WAValidator from 'multicoin-address-validator'

export const isValidAddress = (chainId: ChainId, thorId: string, address: string): boolean => {
  switch (true) {
    case thorId.startsWith('ETH:'):
    case thorId.startsWith('BTC:'):
    case thorId.startsWith('BCH:'):
    case thorId.startsWith('LTC:'):
    case thorId.startsWith('BNB:'):
    case thorId.startsWith('DOGE:'):
    case thorId.startsWith('AVAX:'): {
      const chainLabel = chainIdToChainLabel(chainId)
      return WAValidator.validate(address, chainLabel)
    }
    case thorId.startsWith('GAIA:'):
      return address.startsWith('cosmos')
    case thorId.startsWith('RUNE:'):
    case thorId.startsWith('THOR:'):
      return address.startsWith('thor')
    default:
      return false
  }
}
