import { BTCInputScriptType } from '@shapeshiftoss/hdwallet-core'
import { Asset } from '@shapeshiftoss/types'
import { BIP32Params, UtxoAccountType } from '@shapeshiftoss/types'

/**
 * Utility function to get BIP32Params and scriptType for chain-adapter functions (getAddress, buildSendTransaction)
 * @param scriptType
 * @param asset
 * @returns object with BIP32Params and scriptType or undefined
 */
export const utxoAccountParams = (
  asset: Asset,
  utxoAccountType: UtxoAccountType,
  accountNumber: number
): { bip32Params: BIP32Params; scriptType: BTCInputScriptType } => {
  switch (utxoAccountType) {
    case UtxoAccountType.SegwitNative:
      return {
        scriptType: BTCInputScriptType.SpendWitness,
        bip32Params: {
          purpose: 84,
          coinType: asset.slip44,
          accountNumber
        }
      }
    case UtxoAccountType.SegwitP2sh:
      return {
        scriptType: BTCInputScriptType.SpendP2SHWitness,
        bip32Params: {
          purpose: 49,
          coinType: asset.slip44,
          accountNumber
        }
      }
    case UtxoAccountType.P2pkh:
      return {
        scriptType: BTCInputScriptType.SpendAddress,
        bip32Params: {
          purpose: 49,
          coinType: asset.slip44,
          accountNumber
        }
      }
    default:
      throw new TypeError('utxoAccountType')
  }
}
