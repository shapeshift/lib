import { HDWallet } from '@shapeshiftoss/hdwallet-core'
import { assetService, swapper } from '@shapeshiftoss/types'

export class SwapError extends Error {}

export interface Swapper {
  /** Returns the swapper type */
  getType(): swapper.Type

  /**
   * Get a Quote along with an unsigned transaction that can be signed and broadcast to execute the swap
   * @param input
   * @param wallet
   **/
  buildQuoteTx(args: swapper.BuildQuoteTxInput): Promise<swapper.Quote>

  /**
   * Get a basic quote (rate) for a trading pair
   * @param input
   */
  getQuote(input: swapper.GetQuoteInput, wallet?: HDWallet): Promise<swapper.Quote>

  /**
   * Get a list of available assets based on the array of assets you send it
   * @param assets
   */
  getAvailableAssets(assets: assetService.Asset[]): assetService.Asset[]

  /**
   * Get a boolean if the trade pair will work
   * @param sellAsset
   * @param buyAsset
   */
  canTradePair(sellAsset: assetService.Asset, buyAsset: assetService.Asset): boolean

  /**
   * Get the usd rate from either the assets symbol or tokenId
   * @param input
   */
  getUsdRate(input: Pick<assetService.Asset, 'symbol' | 'tokenId'>): Promise<string>

  /**
   * Get the default pair of the swapper
   */
  getDefaultPair(): Pick<assetService.Asset, 'chain' | 'symbol' | 'name'>[]

  /**
   * Get the minimum and maximum trade value of the sellAsset and buyAsset
   * @param input
   */
  getMinMax(input: swapper.GetQuoteInput): Promise<swapper.MinMaxOutput>

  /**
   * Execute a quote built with buildQuoteTx by signing and broadcasting
   * @param input
   * @param wallet
   */
  executeQuote(args: swapper.ExecQuoteInput): Promise<swapper.ExecQuoteOutput>

  /**
   * Get a boolean if a quote needs approval
   */

  approvalNeeded(args: swapper.ApprovalNeededInput): Promise<swapper.ApprovalNeededOutput>
}
