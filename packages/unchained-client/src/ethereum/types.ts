import { EthereumTx } from '../generated/ethereum'
import { StandardTx, StandardTxMetadata } from '../types'

export interface InternalTx {
  blockNumber: string
  timeStamp: string
  hash: string
  from: string
  to: string
  value: string
  contractAddress: string
  input: string
  type: string
  gas: string
  gasUsed: string
  traceId: string
  isError: string
  errCode: string
}

export interface ParsedTx extends StandardTx {
  data?: StandardTxMetadata
}

export type TxSpecific = Partial<Pick<ParsedTx, 'trade' | 'transfers' | 'data'>>

export interface SubParser {
  parse(tx: EthereumTx): Promise<TxSpecific | undefined>
}
