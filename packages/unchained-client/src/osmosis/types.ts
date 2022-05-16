import { StandardTx, StandardTxMetadata } from '../types'

export interface TxMetadata extends Omit<StandardTxMetadata, 'parser'> {
  parser: 'osmosis'
  delegator?: string
  sourceValidator?: string
  destinationValidator?: string
  assetId?: string
  value?: string
  ibcDestination?: string
  ibcSource?: string
}

export interface ParsedTx extends StandardTx {
  data?: TxMetadata
}
