import type { evm } from '@shapeshiftoss/common-api'

import { BaseTxMetadata, StandardTx, StandardTxMetadata } from '../../types'
import {
  CowSwapTxMetadata,
  FoxyTxMetadata,
  ThorTxMetadata,
  WethTxMetadata,
  YearnTxMetadata,
} from '../ethereum/parser/types'

export type Tx = evm.Tx

export enum TxParser {
  ERC20 = 'erc20',
}

export interface ERC20TxMetadata extends BaseTxMetadata {
  parser: TxParser.ERC20
  assetId?: string
  value?: string
}

export type TxMetadata =
  | StandardTxMetadata
  | ERC20TxMetadata
  | YearnTxMetadata
  | CowSwapTxMetadata
  | FoxyTxMetadata
  | ThorTxMetadata
  | WethTxMetadata

export interface ParsedTx extends StandardTx {
  data?: TxMetadata
}

export type TxSpecific = Partial<Pick<ParsedTx, 'trade' | 'transfers' | 'data'>>

export interface SubParser<T extends Tx, U = TxSpecific> {
  parse(tx: T): Promise<U | undefined>
}
