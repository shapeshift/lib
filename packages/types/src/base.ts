import { ETHSignTx, BTCSignTx, HDWallet } from '@shapeshiftoss/hdwallet-core'
import { Ethereum, SignTxInput } from './chain-adapters'

/** Common */

export type BIP32Params = {
  purpose: number
  coinType: number
  accountNumber: number
  isChange?: boolean
  index?: number
}

export enum ContractTypes {
  ERC20 = 'ERC20',
  ERC721 = 'ERC721',
  OTHER = 'OTHER',
  NONE = 'NONE'
}

export enum ChainTypes {
  'Ethereum' = 'ethereum',
  'Bitcoin' = 'bitcoin'
}

export enum NetworkTypes {
  MAINNET = 'MAINNET',
  TESTNET = 'TESTNET', // BTC, LTC, etc...
  ETH_ROPSTEN = 'ETH_ROPSTEN',
  ETH_RINKEBY = 'ETH_RINKEBY'
}

// asset-service

type AbstractAsset = {
  chain: ChainTypes
  network: NetworkTypes
  symbol: string
  name: string
  precision: number
  slip44: number
  color: string
  secondaryColor: string
  icon: string
  explorer: string
  explorerTxLink: string
  sendSupport: boolean
  receiveSupport: boolean
}

type OmittedTokenAssetFields = 'chain' | 'network' | 'slip44' | 'explorer' | 'explorerTxLink'
type TokenAssetFields = {
  tokenId: string
  contractType: ContractTypes
}
export type TokenAsset = Omit<AbstractAsset, OmittedTokenAssetFields> & TokenAssetFields
export type BaseAsset = AbstractAsset & { tokens?: TokenAsset[] }
export type Asset = AbstractAsset & Partial<TokenAssetFields>

// market-service

export type MarketData = {
  price: string
  marketCap: string
  volume: string
  changePercent24Hr: number
}

export enum HistoryTimeframe {
  HOUR = '1H',
  DAY = '24H',
  WEEK = '1W',
  MONTH = '1M',
  YEAR = '1Y',
  ALL = 'All'
}

export type HistoryData = {
  price: number
  date: string
}

export type PriceHistoryArgs = {
  chain: ChainTypes
  timeframe: HistoryTimeframe
  tokenId?: string
}

export type MarketDataArgs = {
  chain: ChainTypes
  tokenId?: string
}

export type MarketDataType = (args: MarketDataArgs) => Promise<MarketData | null>

export type PriceHistoryType = (args: PriceHistoryArgs) => Promise<HistoryData[] | null>

// swapper

export enum SwapperType {
  Zrx = '0x',
  Thorchain = 'Thorchain'
}

export type SwapSource = {
  name: string
  proportion: string
}

export interface MinMaxOutput {
  minimum: string
  maximum: string
  minimumPrice?: string
}

export type QuoteResponse = {
  price: string
  guaranteedPrice: string
  to: string
  data?: string
  value?: string
  gas?: string
  estimatedGas?: string
  gasPrice?: string
  protocolFee?: string
  minimumProtocolFee?: string
  buyTokenAddress?: string
  sellTokenAddress?: string
  buyAmount?: string
  sellAmount?: string
  allowanceTarget?: string
  sources?: Array<SwapSource>
}

export type ThorVaultInfo = {
  routerContractAddress?: string
  vaultAddress: string
  timestamp: string
}

export type SignTx = ETHSignTx | BTCSignTx

type ChainTxTypeInner = {
  [ChainTypes.Ethereum]: ETHSignTx
  [ChainTypes.Bitcoin]: BTCSignTx
}

export type ChainTxType<T> = T extends keyof ChainTxTypeInner ? ChainTxTypeInner[T] : never

export type BuildThorTradeOutput = SignTxInput<unknown> & ThorVaultInfo

export type Quote = {
  success: boolean
  statusCode?: number
  statusReason?: string
  sellAssetAccountId?: string
  buyAssetAccountId?: string
  sellAsset: Asset
  buyAsset: Asset
  rate?: string
  depositAddress?: string // this is dex contract address for eth swaps
  receiveAddress?: string
  buyAmount?: string
  sellAmount?: string
  minimum?: string | null
  maximum?: string | null
  guaranteedPrice?: string
  slipScore?: string
  txData?: string
  value?: string
  feeData?: Ethereum.FeeData
  allowanceContract?: string
  allowanceGrantRequired?: boolean
  slippage?: string
  priceImpact?: string
  orderId?: string
  sources?: Array<SwapSource>
  timestamp?: number
}

export type GetQuoteInput = {
  sellAsset: Asset
  buyAsset: Asset
  sellAmount?: string
  buyAmount?: string
  sellAssetAccountId?: string
  buyAssetAccountId?: string
  slippage?: string
  priceImpact?: string
  sendMax?: boolean
  minimumPrice?: string
  minimum?: string
}

export type BuildQuoteTxInput = {
  input: GetQuoteInput
  wallet: HDWallet
}

export type ExecQuoteInput = {
  quote: Quote
  wallet: HDWallet
}

export type ExecQuoteOutput = {
  txid: string
}

export type ApprovalNeededInput = {
  quote: Quote
  wallet: HDWallet
}

export type ApprovalNeededOutput = {
  approvalNeeded: boolean
  gas?: string
  gasPrice?: string
}
