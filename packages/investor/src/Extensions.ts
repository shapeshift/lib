import type { BigNumber } from 'bignumber.js'

export interface RebasingToken {}

export interface ApprovalRequired {
  isApprovalRequired: true
  allowance: (address: string) => Promise<unknown>
  prepareApprove: (address: string) => Promise<unknown>
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
