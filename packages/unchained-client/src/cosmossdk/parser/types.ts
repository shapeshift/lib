import { StandardTx } from '../../types'
import * as cosmos from '../cosmos/parser'
import * as osmosis from '../osmosis/parser'
import * as cosmossdk from '../types'

export type Tx = cosmossdk.Tx

export type TxMetadata = cosmos.TxMetadata | osmosis.TxMetadata

export interface ParsedTx extends StandardTx {
  data?: TxMetadata
}
