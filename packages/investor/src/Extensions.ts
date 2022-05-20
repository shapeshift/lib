import { ETHWallet } from '@shapeshiftoss/hdwallet-core'
import type { BigNumber } from 'bignumber.js'

export interface RebasingToken {}

export type ApproveInput = {
  accountNumber?: number
  dryRun?: boolean
  address: string
  wallet: ETHWallet
}
export interface ApprovalRequired {
  isApprovalRequired: true
  allowance: (address: string) => Promise<unknown>
  prepareApprove: (input: ApproveInput) => Promise<unknown>
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
