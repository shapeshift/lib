import { AssetId, ChainId, cosmosAssetId } from '@shapeshiftoss/caip'

import { Tx } from '../../../generated/cosmos'
import { BaseTxMetadata } from '../../../types'
import { BaseTransactionParser, BaseTransactionParserArgs } from '../../parser'

export interface TxMetadata extends BaseTxMetadata {
  parser: 'cosmos'
  delegator?: string
  sourceValidator?: string
  destinationValidator?: string
  assetId?: string
  value?: string
  ibcDestination?: string
  ibcSource?: string
}

export class TransactionParser extends BaseTransactionParser<Tx> {
  chainId: ChainId
  assetId: AssetId

  constructor(args: BaseTransactionParserArgs) {
    super(args)
    this.assetId = cosmosAssetId
  }
}
