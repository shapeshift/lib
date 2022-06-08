import { AssetId, ChainNamespace } from '@shapeshiftoss/caip'
import { createErrorClass } from '@shapeshiftoss/errors'
import { BTCSignTx, ETHSignTx, HDWallet } from '@shapeshiftoss/hdwallet-core'
import { Asset, ChainSpecific, KnownChainIds } from '@shapeshiftoss/types'

export const SwapError = createErrorClass('SwapError')

type ChainSpecificQuoteFeeData<T extends ChainNamespace> = ChainSpecific<
  T,
  {
    eip155: {
      estimatedGas?: string
      gasPrice?: string
      approvalFee?: string
      totalFee?: string
    }
  }
>

export type QuoteFeeData<T extends ChainNamespace> = {
  fee: string
} & ChainSpecificQuoteFeeData<T>

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
  sellAmount: string
  sendMax: boolean
  sellAssetAccountId: string
}
export type GetTradeQuoteInput = CommonTradeInput

export type BuildTradeInput = CommonTradeInput & {
  buyAssetAccountId: string
  slippage?: string
  wallet: HDWallet
}

interface TradeBase<C extends ChainNamespace> {
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

export interface TradeQuote<C extends ChainNamespace> extends TradeBase<C> {
  minimum: string
  maximum: string
}

export interface Trade<C extends ChainNamespace> extends TradeBase<C> {
  receiveAddress: string
}

export interface ZrxTrade extends Trade<'eip155'> {
  txData: string
  depositAddress: string
}

export interface BtcThorTrade<C extends ChainNamespace> extends Trade<C> {
  chainId: KnownChainIds.BitcoinMainnet
  txData: BTCSignTx
}

export interface EthThorTrade<C extends ChainNamespace> extends Trade<C> {
  chainId: KnownChainIds.EthereumMainnet
  txData: ETHSignTx
}

export type ThorTrade<C extends ChainNamespace> = BtcThorTrade<C> | EthThorTrade<C>

export type ExecuteTradeInput<C extends ChainNamespace> = {
  trade: Trade<C>
  wallet: HDWallet
}

export type TradeResult = {
  tradeId: string
}

export type ApproveInfiniteInput<C extends ChainNamespace> = {
  quote: TradeQuote<C>
  wallet: HDWallet
}

export type ApprovalNeededInput<C extends ChainNamespace> = {
  quote: TradeQuote<C>
  wallet: HDWallet
}

export type SwapSource = {
  name: string
  proportion: string
}

export interface MinMaxOutput {
  minimum: string
  maximum: string
}

export type GetMinMaxInput = {
  sellAsset: Asset
  buyAsset: Asset
}

export type ApprovalNeededOutput = {
  approvalNeeded: boolean
}

export enum SwapperType {
  Zrx = '0x',
  Thorchain = 'Thorchain',
  CowSwap = 'CowSwap',
  Test = 'Test'
}

export type TradeTxs = {
  sellTxid: string
  buyTxid?: string
}

// Swap Errors
export enum SwapErrorTypes {
  ALLOWANCE_REQUIRED_FAILED = 'ALLOWANCE_REQUIRED_FAILED',
  APPROVE_INFINITE_FAILED = 'APPROVE_INFINITE_FAILED',
  BUILD_TRADE_FAILED = 'BUILD_TRADE_FAILED',
  CHECK_APPROVAL_FAILED = 'CHECK_APPROVAL_FAILED',
  EXECUTE_TRADE_FAILED = 'EXECUTE_TRADE_FAILED',
  GRANT_ALLOWANCE_FAILED = 'GRANT_ALLOWANCE_FAILED',
  INITIALIZE_FAILED = 'INITIALIZE_FAILED',
  MANAGER_ERROR = 'MANAGER_ERROR',
  MIN_MAX_FAILED = 'MIN_MAX_FAILED',
  RESPONSE_ERROR = 'RESPONSE_ERROR',
  SIGN_AND_BROADCAST_FAILED = 'SIGN_AND_BROADCAST_FAILED',
  TRADE_QUOTE_FAILED = 'TRADE_QUOTE_FAILED',
  UNSUPPORTED_PAIR = 'UNSUPPORTED_PAIR',
  USD_RATE_FAILED = 'USD_RATE_FAILED',
  UNSUPPORTED_CHAIN = 'UNSUPPORTED_CHAIN',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  MAKE_MEMO_FAILED = 'MAKE_MEMO_FAILED',
  PRICE_RATIO_FAILED = 'PRICE_RATIO_FAILED'
}

export interface Swapper<T extends ChainNamespace, TxType = unknown> {
  /** perform any necessary async initialization */
  initialize(): Promise<void>

  /** Returns the swapper type */
  getType(): SwapperType

  /**
   * Get builds a trade with definitive rate & txData that can be executed with executeTrade
   **/
  buildTrade(args: BuildTradeInput): Promise<Trade<T>>

  /**
   * Get a trade quote
   */
  getTradeQuote(input: GetTradeQuoteInput): Promise<TradeQuote<T>>

  /**
   * Get the usd rate from either the assets symbol or tokenId
   */
  getUsdRate(input: Asset): Promise<string>

  /**
   * Execute a trade built with buildTrade by signing and broadcasting
   */
  executeTrade(args: ExecuteTradeInput<T>): Promise<TradeResult>

  /**
   * Get a boolean if a quote needs approval
   */
  approvalNeeded(args: ApprovalNeededInput<T>): Promise<ApprovalNeededOutput>

  /**
   * Get the txid of an approve infinite transaction
   */
  approveInfinite(args: ApproveInfiniteInput<T>): Promise<string>

  /**
   * Get supported buyAssetId's by sellAssetId
   */
  filterBuyAssetsBySellAssetId(args: BuyAssetBySellIdInput): AssetId[]

  /**
   * Get supported sell assetIds
   */
  filterAssetIdsBySellable(assetIds: AssetId[]): AssetId[]

  getTradeTxs(tradeResult: TradeResult): Promise<TxType>
}
