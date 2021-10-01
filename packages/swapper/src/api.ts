import { HDWallet } from '@shapeshiftoss/hdwallet-core'
import {
  Asset,
  BuildQuoteTxArgs,
  GetQuoteInput,
  MinMaxOutput,
  Quote,
  SwapperType
} from '@shapeshiftoss/types'

export class SwapError extends Error {}

export interface Swapper {
  /** Returns the swapper type */
  getType(): SwapperType

  /**
   * Get a Quote along with an unsigned transaction that can be signed and broadcast to execute the swap
   * @param input
   * @param wallet
   **/
  buildQuoteTx(args: BuildQuoteTxArgs): Promise<Quote | undefined>

  /**
   * Get a basic quote (rate) for a trading pair
   * @param input
   */
  getQuote(input: GetQuoteInput, wallet?: HDWallet): Promise<Quote | undefined>

  /**
   * Get a list of available assets based on the array of assets you send it
   * @param assets
   */
  getAvailableAssets(assets: Asset[]): Asset[]

  /**
   * Get a boolean if the trade pair will work
   * @param sellAsset
   * @param buyAsset
   */
  canTradePair(sellAsset: Asset, buyAsset: Asset): boolean

  /**
   * Get the usd rate from either the assets symbol or tokenId
   * @param input
   */
  getUsdRate(input: Pick<Asset, 'symbol' | 'tokenId'>): Promise<string>

  /**
   * Get the minimum and maximum trade value of the sellAsset and buyAsset
   * @param input
   */
  getMinMax(input: GetQuoteInput): Promise<MinMaxOutput>
}
