import type { ChainAdapter } from '@shapeshiftoss/chain-adapters'
import type { HDWallet } from '@shapeshiftoss/hdwallet-core'
import { ChainTypes } from '@shapeshiftoss/types'
import type { BigNumber } from 'bignumber.js'

export type DepositWithdrawArgs = { address: string; amount: BigNumber }

export abstract class InvestorOpportunity<
  ChainType extends ChainTypes,
  TxType = unknown,
  MetaData = unknown
> {
  readonly id: string // opportunity address (contract address / validator address)
  readonly displayName: string
  readonly underlyingAsset: {
    assetId: string
  }
  readonly positionAsset: {
    assetId: string
    balance: BigNumber // This is probably a wallet concern not a opportunity concern
    price: BigNumber // price of UnderlyingAsset per PositionAsset
  }
  readonly feeAsset: {
    assetId: string
  }
  readonly apr: BigNumber // 1 = 100%, 0.01 = 1%, 2 = 200%
  readonly tvl: {
    assetId: string
    balance: BigNumber
  }
  readonly metadata: MetaData

  prepareWithdrawal: (input: DepositWithdrawArgs) => Promise<TxType>
  prepareDeposit: (input: DepositWithdrawArgs) => Promise<TxType>
  /**
   * @returns {string} TXID
   */
  signAndBroadcast: (
    deps: { wallet: HDWallet; chainAdapter: ChainAdapter<ChainType> },
    tx: TxType
  ) => Promise<string>
}
