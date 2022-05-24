import type { ChainTypes } from '@shapeshiftoss/types'

import { InvestorOpportunity } from './InvestorOpportunity'

export interface Investor<C extends ChainTypes, TxType = unknown, MetaData = unknown> {
  initialize: () => Promise<void>
  findAll: () => Promise<Array<InvestorOpportunity<C, TxType, MetaData>>>
  findByOpportunityId: (
    opportunityId: string
  ) => Promise<InvestorOpportunity<C, TxType, MetaData> | undefined>
  findByUnderlyingAssetId: (assetId: string) => Promise<InvestorOpportunity<C, TxType, MetaData>[]>
}
