import { InvestorOpportunity } from './InvestorOpportunity'

export interface Investor<TxType, T = unknown> {
  initialize: () => Promise<void>
  findAll: () => Promise<Array<InvestorOpportunity<TxType, T>>>
  findByOpportunityId: (
    opportunityId: string
  ) => Promise<InvestorOpportunity<TxType, T> | undefined>
  findByUnderlyingAssetId: (assetId: string) => Promise<InvestorOpportunity<TxType, T> | undefined>
}
