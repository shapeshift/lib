import { InvestorOpportunity } from './InvestorOpportunity'

export interface Investor<T = unknown> {
  initialize: () => Promise<void>
  findAll: () => Promise<Array<InvestorOpportunity<T>>>
  findByAddress: (address: string) => Promise<InvestorOpportunity<T> | undefined>
}
