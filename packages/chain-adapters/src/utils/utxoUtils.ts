import { BTCInputScriptType, BTCOutputScriptType } from '@shapeshiftoss/hdwallet-core'
import { Asset} from '@shapeshiftoss/types'
import { BIP32Params, UtxoAccountType } from '@shapeshiftoss/types'
// eslint-disable-next-line prettier/prettier
import type { bitcoin } from '@shapeshiftoss/unchained-client'
import { BigNumber } from 'bignumber.js'
import coinSelect from 'coinselect'

/**
 * Utility function to convert a BTCInputScriptType to the corresponding BTCOutputScriptType
 * @param x a BTCInputScriptType
 * @returns the corresponding BTCOutputScriptType
 */
export const toBtcOutputScriptType = (x: BTCInputScriptType) => {
  switch (x) {
    case BTCInputScriptType.SpendWitness:
      return BTCOutputScriptType.PayToWitness
    case BTCInputScriptType.SpendP2SHWitness:
      return BTCOutputScriptType.PayToP2SHWitness
    case BTCInputScriptType.SpendMultisig:
      return BTCOutputScriptType.PayToMultisig
    case BTCInputScriptType.SpendAddress:
      return BTCOutputScriptType.PayToAddress
    default:
      throw new TypeError('scriptType')
  }
}

/**
 * Utility function to get BIP32Params and scriptType for chain-adapter functions (getAddress, buildSendTransaction)
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
          purpose: 44,
          coinType: asset.slip44,
          accountNumber
        }
      }
    default:
      throw new TypeError('utxoAccountType')
  }
}

/**
 * Convert sats per kilobyte to sats per byte
 */
export const convertSatsPerKilobyteToPerByte = (value: BigNumber.Value | undefined) =>
  value ? new BigNumber(value).div(1024).integerValue() : undefined

/**
 * Get a list of possible transaction fees for a given set of UTXOs and an amount to be transacted
 *
 * @returns {Array.<BigNumber | undefined>} - Array of estimated fees or undefined.  Returns undefined if an estimated fee cannot be calculated
 *
 * @param {Array.<BigNumber | undefined>} satsPerByte - array of fees in sats per byte
 * @param utxos - array of Utxos that can be used to build a transaction for {amount}
 * @param amount - the amount to be transacted
 * @param to - The destination address
 */
export const calculateEstimatedFees = (satsPerByte: (BigNumber | undefined)[], utxos: bitcoin.api.Utxo[], amount: number | string, to: string) => {
  if (!isFinite(Number(amount))) throw new Error('Invalid amount')
  const convertedUtxos = utxos.map((x) => ({ ...x, value: Number(x.value) }))

  return satsPerByte.map(fee => {
      let result: BigNumber | undefined
      if (fee) {
        const estFee = coinSelect(convertedUtxos, [{ value: Number(amount), address: to }], fee.toNumber()).fee
        result = estFee ? new BigNumber(estFee) : undefined
      }

      return result
    })
}
