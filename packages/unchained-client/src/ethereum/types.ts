import { EthereumTx } from '../generated/ethereum'
import { StandardTx, StandardTxMetadata } from '../types'

export interface ParsedTx extends StandardTx {
  data?: StandardTxMetadata
}

export type TxSpecific = Partial<Pick<ParsedTx, 'trade' | 'transfers' | 'data'>>

export interface SubParser {
  parse(tx: EthereumTx): Promise<TxSpecific | undefined>
}
