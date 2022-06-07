import { EthereumTx } from '../generated/ethereum'
import { BaseTxMetadata, StandardTx, StandardTxMetadata } from '../types'

export enum TxParser {
  ERC20Approve = 'erc20Approve'
}

export interface ERC20ApproveTxMetadata extends BaseTxMetadata {
  parser: TxParser.ERC20Approve
  assetId?: string
}

export type TxMetadata = StandardTxMetadata | ERC20ApproveTxMetadata

export interface ParsedTx extends StandardTx {
  data?: TxMetadata
}

export type TxSpecific = Partial<Pick<ParsedTx, 'trade' | 'transfers' | 'data'>>

export interface SubParser {
  parse(tx: EthereumTx): Promise<TxSpecific | undefined>
}
