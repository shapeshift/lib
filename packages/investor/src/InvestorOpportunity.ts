import type { BigNumber } from 'bignumber.js'

// @TODO: Add EventEmitter support? We may want to raise an 'updated' event
// so React can listen and re-render on data change?
// Maybe just take a callback?

export abstract class InvestorOpportunity<T = unknown> {
  static create: <U = unknown>(details: { address: string }) => Promise<InvestorOpportunity<U>>
  readonly id: string // opportunity address (contract address / validator address)
  readonly displayName: string
  readonly isApprovalRequired: boolean = false
  readonly underlyingAsset: {
    assetId: string
    balance: BigNumber
  }
  readonly positionAsset: {
    assetId: string
    balance: BigNumber
  }
  readonly apr: BigNumber
  readonly price: BigNumber // in terms of USD? - maybe not needed in here
  readonly supply: BigNumber // which asset? the underlying or the position?
  readonly tvl: BigNumber // total volume locked for the entire opportunity
  readonly metadata: T

  withdraw: (address: string, amount: BigNumber) => Promise<unknown>
  deposit: (amount: BigNumber) => Promise<unknown>
  signAndBroadcast: (tx: unknown) => Promise<unknown>
}
