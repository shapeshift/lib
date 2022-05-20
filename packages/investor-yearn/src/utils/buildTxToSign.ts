import { BIP44Params } from '@shapeshiftoss/types'
import { numberToHex } from 'web3-utils'

type BuildTxToSignInput = {
  chainId: number
  data: string
  estimatedGas: string
  gasPrice: string
  nonce: string
  value: string
  to: string
}

export function toPath(bip44Params: BIP44Params): string {
  const { purpose, coinType, accountNumber, isChange = false, index = 0 } = bip44Params
  if (typeof purpose === 'undefined') throw new Error('toPath: bip44Params.purpose is required')
  if (typeof coinType === 'undefined') throw new Error('toPath: bip44Params.coinType is required')
  if (typeof accountNumber === 'undefined')
    throw new Error('toPath: bip44Params.accountNumber is required')
  return `m/${purpose}'/${coinType}'/${accountNumber}'/${Number(isChange)}/${index}`
}

export function buildTxToSign({
  chainId = 1,
  data,
  estimatedGas,
  gasPrice,
  nonce,
  to,
  value
}: BuildTxToSignInput) {
  return {
    value: numberToHex(value),
    to,
    chainId, // TODO: implement for multiple chains
    data,
    nonce: numberToHex(nonce),
    gasLimit: numberToHex(estimatedGas),
    gasPrice // Convert to hex in signAndBroadcast
  }
}
