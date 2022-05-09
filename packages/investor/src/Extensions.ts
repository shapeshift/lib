import type { BigNumber } from 'bignumber.js'

export interface RebasingToken {}

export interface ApprovalRequired {
  isApprovalRequired: true
  allowance: () => Promise<unknown>
  approve: () => Promise<unknown>
}

export interface ClaimableReward {
  isRewardClaimable: true
  claim: () => Promise<unknown>

  readonly rewardAsset: {
    assetId: string
    balance: BigNumber
  }
}

export interface DelayedWithdrawal {
  delayInMinutes: number // 14 * 24 * 60 = 14 days
  inProgressWithdrawals: []
  withdrawWithDelay: () => Promise<unknown>
}
