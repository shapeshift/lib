import { chainAdapters, ContractTypes } from '@shapeshiftoss/types'
import { Status, TransferType } from '@shapeshiftoss/unchained-tx-parser'

export * from './bip32'
export * from './utxoUtils'

export const getContractType = (type?: string): ContractTypes => {
  if (!type) return ContractTypes.NONE
  if (type === 'ERC20') return ContractTypes.ERC20
  if (type === 'ERC721') return ContractTypes.ERC721

  return ContractTypes.OTHER
}

export const getStatus = (status: Status): chainAdapters.TxStatus => {
  if (status === Status.Pending) return chainAdapters.TxStatus.Pending
  if (status === Status.Confirmed) return chainAdapters.TxStatus.Confirmed
  if (status === Status.Failed) return chainAdapters.TxStatus.Failed

  return chainAdapters.TxStatus.Unknown
}

export const getType = (type: TransferType): chainAdapters.TxType => {
  if (type === TransferType.Send) return chainAdapters.TxType.Send
  if (type === TransferType.Receive) return chainAdapters.TxType.Receive

  return chainAdapters.TxType.Unknown
}
