import { BTCInputScriptType } from '@shapeshiftoss/hdwallet-core'
import { Asset, ChainTypes } from '@shapeshiftoss/types'
import { BIP32Params } from '@shapeshiftoss/types'

import { ChainAdapter as BitcoinChainAdapter } from '../bitcoin/BitcoinChainAdapter'
import { ChainAdapter as EthereumChainAdapter } from '../ethereum/EthereumChainAdapter'

/**
 * Returns coin purpose from a given script type
 * @param scriptType
 * @returns 44 | 49 | 84
 */
export const purposeFromScript = (scriptType: BTCInputScriptType): 44 | 49 | 84 => {
  switch (scriptType) {
    case BTCInputScriptType.SpendP2SHWitness:
      return 49
    case BTCInputScriptType.SpendAddress:
      return 44
    case BTCInputScriptType.SpendWitness:
    default:
      return 84
  }
}

/**
 * Utility function to bip32Params from script type
 * Get return an object with bip32Params derived from script type and asset
 * @param scriptType
 * @param asset
 * @returns BIP32Params
 */
export const bip32FromScript = (scriptType: BTCInputScriptType, asset: Asset): BIP32Params => {
  const purpose = purposeFromScript(scriptType)

  switch (asset.chain) {
    case ChainTypes.Bitcoin: {
      return { ...BitcoinChainAdapter.defaultBIP32Params, purpose }
    }
    case ChainTypes.Ethereum: {
      return { ...EthereumChainAdapter.defaultBIP32Params, purpose }
    }
  }
}

/**
 * Utility function to get params to get BIP32Params and scriptType for chain-adapter functions (getAddress, buildSendTransaction)
 * Get return an object with utxo bip32Params derived from script type and asset
 * @param scriptType
 * @param asset
 * @returns object with BIP32Params and scriptType or undefined
 */
export const bip32AndScript = (
  scriptType: BTCInputScriptType | undefined,
  asset: Asset
): { bip32Params: BIP32Params; scriptType: BTCInputScriptType } | Record<string, unknown> => {
  if (asset.chain === ChainTypes.Bitcoin && scriptType) {
    const bip32Params = bip32FromScript(scriptType, asset)
    if (bip32Params) return { bip32Params, scriptType }
  }
  return {}
}
