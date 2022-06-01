import type { HDWallet } from '@shapeshiftoss/hdwallet-core'
import type { BigNumber } from 'bignumber.js'

import { FeePriority } from './Extensions'

export type DepositWithdrawArgs = { address: string; amount: BigNumber }

export abstract class InvestorOpportunity<TxType = unknown, MetaData = unknown> {
  /**
   * Opportunity id e.g., contract address or validator address
   */
  readonly id: string
  readonly displayName: string
  readonly underlyingAsset: {
    /**
     * Asset to be deposited
     *
     * User needs an available balance of this asset to be able to deposit
     */
    assetId: string
  }
  readonly positionAsset: {
    /**
     * Asset that represents their position
     */
    assetId: string
    /**
     * The amount of the position asset, not the underlying asset
     */
    balance: BigNumber // This is probably a wallet concern not a opportunity concern
    /**
     * The ratio of value between the underlying asset and the position asset
     *
     * Multiply the position asset by this value to calculate the amount of underlying asset
     * that will be received for a withdrawal
     *
     * Amount is an integer value without precision applied
     */
    price: BigNumber
  }
  readonly feeAsset: {
    /**
     * Asset used to pay transaction fees
     */
    assetId: string
  }
  /**
   * The estimated return on deposited assets
   *
   * Amount is an integer value without precision applied
   *
   * @example An APY of "1.0" means 100%
   */
  readonly apy: BigNumber
  readonly tvl: {
    /**
     * Asset that represents the total volume locked in the opportunity
     */
    assetId: string
    /**
     * The total amount of the TVL asset that is locked in the opportuntity
     *
     * Amount is an integer value without precision applied
     */
    balance: BigNumber
  }

  /**
   * Protocol specific information
   */
  readonly metadata?: MetaData

  /**
   * Prepare an unsigned withdrawal transaction
   *
   * @param input.address - The user's wallet address where the funds are
   * @param input.amount - The amount (as an integer value) of the position asset
   */
  prepareWithdrawal: (input: DepositWithdrawArgs) => Promise<TxType>

  /**
   * Prepare an unsigned deposit transaction
   *
   * @param input.address - The user's wallet address where the funds are
   * @param input.amount - The amount (as an integer value) of the underlying asset
   */
  prepareDeposit: (input: DepositWithdrawArgs) => Promise<TxType>

  /**
   * Sign and broadcast a previously prepared transaction
   *
   * @param deps.wallet - HDWallet instance
   * @param args.tx - Prepared unsigned transaction (from prepareWithdrawal/Deposit)
   * @param args.feePriority - Specify the user's preferred fee priority (fast/average/slow)
   */
  signAndBroadcast: (
    deps: { wallet: HDWallet },
    args: { tx: TxType; feePriority?: FeePriority }
  ) => Promise<string>
}
