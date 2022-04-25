import { CAIP19 } from '@shapeshiftoss/caip'
import { HDWallet } from '@shapeshiftoss/hdwallet-core'
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
  SendMaxAmountInput,
  SwapperType
} from '@shapeshiftoss/types'

export type SupportedAssetInput = {
  assetIds: CAIP19[]
}

export type ByPairInput = {
  sellAssetId: CAIP19
  buyAssetId: CAIP19
}

export type BuyAssetBySellIdInput = {
  sellAssetId: CAIP19
  buyAssetIds: CAIP19[]
}

export type SupportedSellAssetsInput = {
  sellAssetIds: CAIP19[]
}

export class SwapError extends Error {}

export interface Swapper {
  /** Returns the swapper type */
  getType(): SwapperType

  /**
   * Get a Quote along with an unsigned transaction that can be signed and broadcast to execute the swap
   **/
  buildQuoteTx(args: BuildQuoteTxInput): Promise<Quote<ChainTypes, SwapperType>>

  /**
   * Get a basic quote (rate) for a trading pair
   */
  getQuote(input: GetQuoteInput, wallet?: HDWallet): Promise<Quote<ChainTypes, SwapperType>>

  /**
   * Get the usd rate from either the assets symbol or tokenId
   */
  getUsdRate(input: Pick<Asset, 'symbol' | 'tokenId'>): Promise<string>

  /**
   * Get the default pair of the swapper
   */
  getDefaultPair(): [CAIP19, CAIP19]

  /**
   * Get the minimum and maximum trade value of the sellAsset and buyAsset
   */
  getMinMax(input: GetQuoteInput): Promise<MinMaxOutput>

  /**
   * Execute a quote built with buildQuoteTx by signing and broadcasting
   */
  executeQuote(args: ExecQuoteInput<ChainTypes, SwapperType>): Promise<ExecQuoteOutput>

  /**
   * Get a boolean if a quote needs approval
   */
  approvalNeeded(args: ApprovalNeededInput<ChainTypes, SwapperType>): Promise<ApprovalNeededOutput>

  /**
   * Get the txid of an approve infinite transaction
   */
  approveInfinite(args: ApproveInfiniteInput<ChainTypes, SwapperType>): Promise<string>

  /**
   * Get max swap balance (minus fees) for sell asset
   */
  getSendMaxAmount(args: SendMaxAmountInput): Promise<string>

  /**
   * Get a boolean if swapper supports an asset
   */
  isSupportedAssets(args: SupportedAssetInput): boolean

  /**
   * Get supported buyAssetId's by sellAssetId
   */
  filterBuyAssetsBySellAssetId(args: BuyAssetBySellIdInput): CAIP19[]

  /**
   * Get supported sell assetIds
   */
  filterAssetIdsBySellable(assetIds: CAIP19[]): CAIP19[]
}
