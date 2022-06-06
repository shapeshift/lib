import { AssetNamespace } from '@shapeshiftoss/caip'
import { Status, TransferType } from '@shapeshiftoss/unchained-client'

import { TxStatus, TxType } from '../types'

export * from './bip44'
export * from './utxoUtils'

export const getAssetNamespace = (type: string): AssetNamespace => {
  if (type === 'ERC20') return 'erc20'
  if (type === 'ERC721') return 'erc721'
  throw new Error(`Unknown asset namespace. type: ${type}`)
}

export const getStatus = (status: Status): TxStatus => {
  if (status === Status.Pending) return TxStatus.Pending
  if (status === Status.Confirmed) return TxStatus.Confirmed
  if (status === Status.Failed) return TxStatus.Failed

  return TxStatus.Unknown
}

export const getType = (type: TransferType): TxType => {
  if (type === TransferType.Send) return TxType.Send
  if (type === TransferType.Receive) return TxType.Receive

  return TxType.Unknown
}
