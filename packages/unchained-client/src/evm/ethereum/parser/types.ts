import { BaseTxMetadata, TxParser } from '../../../types'

export interface YearnTxMetadata extends BaseTxMetadata {
  parser: TxParser.Yearn
  assetId?: string
  value?: string
}

export interface CowSwapTxMetadata extends BaseTxMetadata {
  parser: TxParser.CowSwap
}

export interface FoxyTxMetadata extends BaseTxMetadata {
  parser: TxParser.Foxy
}

export interface ThorTxMetadata extends BaseTxMetadata {
  parser: TxParser.Thor
}

export interface WethTxMetadata extends BaseTxMetadata {
  parser: TxParser.Thor
}

export interface UniV2TxMetadata extends BaseTxMetadata {
  parser: TxParser.UniV2
}
