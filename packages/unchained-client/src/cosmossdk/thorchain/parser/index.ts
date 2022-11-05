import { thorchainAssetId } from '@keepkey/caip'

import { Tx } from '../../../generated/thorchain'
import { BaseTransactionParser, BaseTransactionParserArgs } from '../../parser'

export type TransactionParserArgs = BaseTransactionParserArgs

export class TransactionParser extends BaseTransactionParser<Tx> {
  constructor(args: TransactionParserArgs) {
    super(args)
    this.assetId = thorchainAssetId
  }
}
