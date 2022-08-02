import type { evm } from '@shapeshiftoss/common-api'

import { BaseTxMetadata, StandardTx, StandardTxMetadata } from '../../types'

export type Tx = evm.Tx

export interface ERC20TxMetadata extends BaseTxMetadata {
  parser: 'erc20'
  assetId?: string
}

export type TxMetadata = StandardTxMetadata | ERC20TxMetadata

export interface ParsedTx extends StandardTx {
  data?: TxMetadata
}

export type TxSpecific = Partial<Pick<ParsedTx, 'trade' | 'transfers' | 'data'>>

export interface SubParser<T extends Tx, U = TxSpecific> {
  parse(tx: T): Promise<U | undefined>
}
