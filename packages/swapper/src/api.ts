import { CAIP19 } from '@shapeshiftoss/caip'
import { HDWallet } from '@shapeshiftoss/hdwallet-core'
import { chainAdapters } from '@shapeshiftoss/types'
import {
  ApprovalNeededInput,
  ApprovalNeededOutput,
  ApproveInfiniteInput,
  Asset,
  BuildQuoteTxInput,
  ChainTypes,
  ExecQuoteInput,
  ExecQuoteOutput,
  GetQuoteInput,
  MinMaxOutput,
  Quote,
  SwapperType
} from '@shapeshiftoss/types/src/'
export type SupportedAssetInput = {
  assetIds: CAIP19[]
}

export type ByPairInput = {
  sellAssetId: CAIP19
  buyAssetId: CAIP19
}

export type BuyAssetBySellIdInput = {
  sellAssetId: CAIP19
  assetIds: CAIP19[]
}

export type SupportedSellAssetsInput = {
  assetIds: CAIP19[]
}

export type GetTradeQuoteInput = {
  sellAsset: Asset
  buyAsset: Asset
  sellAmount?: string
  buyAmount?: string
  sendMax?: boolean
  priceImpact?: string // TODO this doesnt belong here but frontend needs it to not break (for now)
}

export type BuildTradeInput = {
  sellAsset: Asset
  buyAsset: Asset
  sellAmount?: string
  buyAmount?: string
  sellAssetAccountId?: string
  buyAssetAccountId?: string
  slippage?: string
  sendMax?: boolean
  wallet: HDWallet
}

export type TradeQuote<C extends ChainTypes> = {
  minimum: string | null
  maximum: string | null
  success: boolean // This will go away when we correctly handle errors
  statusReason: string // This will go away when we correctly handle errors
  sellAsset: Asset
  buyAsset: Asset
  feeData: chainAdapters.QuoteFeeData<C>
  rate: string
  buyAmount: string
  sellAmount: string
  allowanceContract: string
  sources: Array<SwapSource>
}

export type BuiltTrade<C extends ChainTypes> = {
  txData: string
  sellAssetAccountId: string
  depositAddress: string
  receiveAddress: string
  success: boolean // This will go away when we correctly handle errors
  statusReason: string // This will go away when we correctly handle errors
  sellAsset: Asset
  buyAsset: Asset
  feeData: chainAdapters.QuoteFeeData<C>
  rate: string
  buyAmount: string
  sellAmount: string
  allowanceContract: string
  sources: Array<SwapSource>
}

export type ExecTradeInput<C extends ChainTypes> = {
  builtTrade: BuiltTrade<C>
  wallet: HDWallet
}

export type ExecTradeOutput = {
  txid: string
}

export type SwapSource = {
  name: string
  proportion: string
}

export class SwapError extends Error {}

export interface Swapper {
  /** Returns the swapper type */
  getType(): SwapperType

  /**
   * Get a Quote along with an unsigned transaction that can be signed and broadcast to execute the swap
   **/
  buildTrade(args: BuildTradeInput): Promise<BuiltTrade<ChainTypes>>

  /**
   * Get a basic quote (rate) for a trading pair
   */
  getTradeQuote(input: GetTradeQuoteInput, wallet?: HDWallet): Promise<TradeQuote<ChainTypes>>

  /**
   * Get a Quote along with an unsigned transaction that can be signed and broadcast to execute the swap
   * @deprecated The method is going away soon.
   **/
  buildQuoteTx(args: BuildQuoteTxInput): Promise<Quote<ChainTypes>>

  /**
   * Get a basic quote (rate) for a trading pair
   * @deprecated The method is going away soon.
   */
  getQuote(input: GetQuoteInput, wallet?: HDWallet): Promise<Quote<ChainTypes>>

  /**
   * Get the usd rate from either the assets symbol or tokenId
   */
  getUsdRate(input: Pick<Asset, 'symbol' | 'tokenId'>): Promise<string>

  /**
   * Get the minimum and maximum trade value of the sellAsset and buyAsset
   */
  getMinMax(input: GetQuoteInput): Promise<MinMaxOutput>

  /**
   * Execute a quote built with buildQuoteTx by signing and broadcasting
   */
  executeQuote(args: ExecQuoteInput<ChainTypes>): Promise<ExecQuoteOutput>

  /**
   * Execute a trade built with buildTradee by signing and broadcasting
   */
  executeTrade(args: ExecTradeInput<ChainTypes>): Promise<ExecQuoteOutput>

  /**
   * Get a boolean if a quote needs approval
   */
  approvalNeeded(args: ApprovalNeededInput<ChainTypes>): Promise<ApprovalNeededOutput>

  /**
   * Get the txid of an approve infinite transaction
   */
  approveInfinite(args: ApproveInfiniteInput<ChainTypes>): Promise<string>

  /**
   * Get supported buyAssetId's by sellAssetId
   */
  filterBuyAssetsBySellAssetId(args: BuyAssetBySellIdInput): CAIP19[]

  /**
   * Get supported sell assetIds
   */
  filterAssetIdsBySellable(assetIds: CAIP19[]): CAIP19[]
}
