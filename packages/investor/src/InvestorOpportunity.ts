import type { ChainAdapter } from '@shapeshiftoss/chain-adapters'
import type { ETHWallet } from '@shapeshiftoss/hdwallet-core'
import { ChainTypes } from '@shapeshiftoss/types'
import type { BigNumber } from 'bignumber.js'

// @TODO: Add EventEmitter support? We may want to raise an 'updated' event
// so React can listen and re-render on data change?
// Maybe just take a callback?

export type DepositWithdrawArgs = { address: string; amount: BigNumber; }

export abstract class InvestorOpportunity<
  ChainType extends ChainTypes,
  TxType = unknown,
  MetaData = unknown
> {
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
  readonly metadata: MetaData

  prepareWithdrawal: (input: DepositWithdrawArgs) => Promise<TxType>
  prepareDeposit: (input: DepositWithdrawArgs) => Promise<TxType>
  /**
   * @returns {string} TXID
   */
  signAndBroadcast: (
    deps: { wallet: ETHWallet; chainAdapter: ChainAdapter<ChainType> },
    tx: TxType
  ) => Promise<string>
}
