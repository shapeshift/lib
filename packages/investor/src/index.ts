import type { BigNumber } from 'bignumber.js'

export interface Investor<T = unknown> {
  initialize: () => Promise<void>
  findAll: () => Promise<Array<InvestorOpportunity<T>>>
  findByAddress: (address: string) => Promise<unknown>
}

interface RebasingToken {

}

interface ApprovalRequired {
  isApprovalRequired: true
  allowance: () => Promise<unknown>
  approve: () => Promise<unknown>
}

interface Reward {
  isRewardClaimable: true
  claim: () => Promise<unknown>
}

interface DelayedWithdrawal {
  delayInMinutes: number // 14 * 24 * 60 = 14 days
  inProgressWithdrawals: []
  withdrawWithDelay: () => Promise<unknown>
}

type SerializedTX = string

enum Fee {
  High,
  Medium,
  Low
}

abstract class InvestorOpportunity<T = unknown> {
  static create: <U = unknown>(details: { address: string }) => Promise<InvestorOpportunity<U>>
  readonly id: string // opportunity address (contract address / validator address)
  readonly displayName: string
  readonly isApprovalRequired: boolean = false
  readonly assetIds: { deposit: string; reward: string; } // CAIP19 / do we need "position" token? (TFOX)
  readonly apr: BigNumber
  readonly balance: BigNumber // user's position balance
  readonly price: BigNumber // in terms of USD? - maybe not needed in here
  readonly supply: BigNumber
  readonly tvl: BigNumber // total volume locked for the entire opportunity
  readonly metadata: T

  withdraw: (amount: BigNumber) => Promise<unknown>
  deposit: (amount: BigNumber) => Promise<SerializedTX>
  signAndBroadcast(tx: SerializedTX) => Promise<unknown>
}

class CosmosInvestorOpportunity extends InvestorOpportunity<unknown> implements Reward {
  readonly isApprovalRequired: false
  readonly isRewardClaimable: true
  claim: () => Promise<unknown>

  private lastFee: { [k: keyof Fee]: BigNumber }

  redelegate: () => Promise<unknown>

  // Fee UI will call `setFee` onClick then `deposit` call won't need to know what fee was selected
  getEstimatedFee: (type: Fee.Deposit | Fee.Withdraw) => Promise<{ [k: keyof Fee]: BigNumber }>
  setFee: (fee: Fee) => void
}
