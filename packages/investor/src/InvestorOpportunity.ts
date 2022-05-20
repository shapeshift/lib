import type { ETHWallet } from '@shapeshiftoss/hdwallet-core'
import type { BigNumber } from 'bignumber.js'
import type { ChainAdapter } from '@shapeshiftoss/chain-adapters'
import { ChainTypes } from '@shapeshiftoss/types'

// @TODO: Add EventEmitter support? We may want to raise an 'updated' event
// so React can listen and re-render on data change?
// Maybe just take a callback?

export type DepositWithdrawArgs = { address: string; amount: BigNumber; wallet: ETHWallet }

export abstract class InvestorOpportunity<TxType, T = unknown> {
  static create: <TxType, U = unknown>(details: { address: string }) => Promise<InvestorOpportunity<TxType, U>>
  readonly id: string // opportunity address (contract address / validator address)
  readonly displayName: string
  readonly underlyingAsset: {
    assetId: string
    balance: BigNumber
  }
  readonly positionAsset: {
    assetId: string
    balance: BigNumber // This is probably a wallet concern not a opportunity concern
    price: BigNumber // price of UnderlyingAsset per PositionAsset
  }
  readonly apr: BigNumber // 1 = 100%, 0.01 = 1%, 2 = 200%
  readonly tvl: {
    assetBalance: BigNumber // with precision applied
    usdcBalance?: BigNumber // 1 = 1 USDC
  } // TVL in terms of UnderlyingAsset
  // readonly supply: BigNumber // Position Asset - we may not need this
  readonly metadata: T

  prepareWithdrawal: (input: DepositWithdrawArgs) => Promise<TxType>
  prepareDeposit: (input: DepositWithdrawArgs) => Promise<TxType>
  /**
   * @returns {string} TXID
   */
  signAndBroadcast: <T extends ChainTypes>(deps: { wallet: ETHWallet; chainAdapter: ChainAdapter<T> }, tx: TxType) => Promise<string>
}
