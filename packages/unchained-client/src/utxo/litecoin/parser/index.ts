import { ASSET_REFERENCE, toAssetId } from '@shapeshiftoss/caip'

import { Tx } from '../../../generated/litecoin'
import { BaseTransactionParser, BaseTransactionParserArgs } from '../../parser'

export type TransactionParserArgs = BaseTransactionParserArgs

export class TransactionParser extends BaseTransactionParser<Tx> {
  constructor(args: TransactionParserArgs) {
    super(args)

    this.assetId = toAssetId({
      chainId: this.chainId,
      assetNamespace: 'slip44',
      assetReference: ASSET_REFERENCE.Litecoin
    })
  }
}
