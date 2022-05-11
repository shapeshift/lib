import { AssetId } from '@shapeshiftoss/caip'
import { HDWallet } from '@shapeshiftoss/hdwallet-core'
import {
  ApprovalNeededOutput,
  Asset,
  ExecQuoteOutput,
  GetQuoteInput,
  MinMaxOutput,
  SwapperType
} from '@shapeshiftoss/types'
import { ethereum } from '@shapeshiftoss/types/src/chain-adapters'
import { ChainSpecific } from '@shapeshiftoss/types/src/utility'

export type SupportedAssetInput = {
  assetIds: AssetId[]
}

export enum ChainIdTypes {
  Ethereum = 'eip155:1/slip44:60',
  Bitcoin = 'bip122:000000000019d6689c085ae165831e93/slip44:0',
  Cosmos = 'cosmos:cosmoshub-4/slip44:118',
  Osmosis = 'cosmos:osmosis-1/slip44:118'
}

type ChainSpecificQuoteFeeData<T1> = ChainSpecific<
  T1,
  {
    [ChainIdTypes.Ethereum]: ethereum.QuoteFeeData
  }
>

export type QuoteFeeData<T1 extends ChainIdTypes> = {
  fee: string
} & ChainSpecificQuoteFeeData<T1>

export type ByPairInput = {
  sellAssetId: AssetId
  buyAssetId: AssetId
}

export type BuyAssetBySellIdInput = {
  sellAssetId: AssetId
  assetIds: AssetId[]
}

export type SupportedSellAssetsInput = {
  assetIds: AssetId[]
}

export type CommonTradeInput = {
  sellAsset: Asset
  buyAsset: Asset
  sellAmount?: string
  buyAmount?: string
  sendMax: boolean
  sellAssetAccountId: string
}
export type GetTradeQuoteInput = CommonTradeInput

export type BuildTradeInput = CommonTradeInput & {
  buyAssetAccountId: string
  slippage?: string
  wallet: HDWallet
}

interface TradeBase<C extends ChainIdTypes> {
  success: boolean // This will go away when we correctly handle errors
  statusReason: string // This will go away when we correctly handle errors
  buyAmount: string
  sellAmount: string
  feeData: QuoteFeeData<C>
  rate: string
  allowanceContract: string
  sources: Array<SwapSource>
  buyAsset: Asset
  sellAsset: Asset
  sellAssetAccountId: string
}

export interface TradeQuote<C extends ChainIdTypes> extends TradeBase<C> {
  minimum: string
  maximum: string
}

export interface Trade<C extends ChainIdTypes> extends TradeBase<C> {
  txData: string
  depositAddress: string
  receiveAddress: string
}

export type ExecuteTradeInput<C extends ChainIdTypes> = {
  trade: Trade<C>
  wallet: HDWallet
}

export type TradeResult = {
  txid: string
}

export type SwapSource = {
  name: string
  proportion: string
}

export type ApproveInfiniteInput<C extends ChainIdTypes> = {
  quote: TradeQuote<C>
  wallet: HDWallet
}

export type ApprovalNeededInput<C extends ChainIdTypes> = {
  quote: TradeQuote<C>
  wallet: HDWallet
}

export class SwapError extends Error {}

export interface Swapper {
  /** Returns the swapper type */
  getType(): SwapperType

  /**
   * Get builds a trade with definitive rate & txData that can be executed with executeTrade
   **/
  buildTrade(args: BuildTradeInput): Promise<Trade<ChainIdTypes>>

  /**
   * Get a trade quote
   */
  getTradeQuote(input: GetTradeQuoteInput): Promise<TradeQuote<ChainIdTypes>>

  /**
   * Get the usd rate from either the assets symbol or tokenId
   */
  getUsdRate(input: Pick<Asset, 'symbol' | 'tokenId'>): Promise<string>

  /**
   * Get the minimum and maximum trade value of the sellAsset and buyAsset
   */
  getMinMax(input: GetQuoteInput): Promise<MinMaxOutput>

  /**
   * Execute a trade built with buildTrade by signing and broadcasting
   */
  executeTrade(args: ExecuteTradeInput<ChainIdTypes>): Promise<ExecQuoteOutput>

  /**
   * Get a boolean if a quote needs approval
   */
  approvalNeeded(args: ApprovalNeededInput<ChainIdTypes>): Promise<ApprovalNeededOutput>

  /**
   * Get the txid of an approve infinite transaction
   */
  approveInfinite(args: ApproveInfiniteInput<ChainIdTypes>): Promise<string>

  /**
   * Get supported buyAssetId's by sellAssetId
   */
  filterBuyAssetsBySellAssetId(args: BuyAssetBySellIdInput): AssetId[]

  /**
   * Get supported sell assetIds
   */
  filterAssetIdsBySellable(assetIds: AssetId[]): AssetId[]
}
