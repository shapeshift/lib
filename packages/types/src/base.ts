import { BTCWallet, ETHWallet, HDWallet } from '@shapeshiftoss/hdwallet-core'

import { QuoteFeeData, SignTxInput } from './chain-adapters'

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
  Ethereum = 'ethereum',
  Bitcoin = 'bitcoin'
}

export enum NetworkTypes {
  MAINNET = 'MAINNET',
  TESTNET = 'TESTNET', // BTC, LTC, etc...
  ETH_ROPSTEN = 'ETH_ROPSTEN',
  ETH_RINKEBY = 'ETH_RINKEBY'
}

export type NetworkTypesForChainType<T extends ChainTypes> =
  | NetworkTypes.MAINNET
  | {
      [ChainTypes.Ethereum]: NetworkTypes.ETH_ROPSTEN | NetworkTypes.ETH_RINKEBY
      [ChainTypes.Bitcoin]: NetworkTypes.TESTNET
    }[T]

// asset-service

type AbstractAsset<C extends ChainTypes> = C extends ChainTypes
  ? {
      caip19: string
      chain: C
      network: NetworkTypesForChainType<C>
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
  : never

type OmittedTokenAssetFields = 'chain' | 'network' | 'slip44' | 'explorer' | 'explorerTxLink'
type TokenAssetFields = {
  tokenId: string
  contractType: ContractTypes
}
type ChainsWithTokenAssets = ChainTypes.Ethereum
export type TokenAsset<C extends ChainsWithTokenAssets = ChainsWithTokenAssets> =
  C extends ChainsWithTokenAssets
    ? Omit<AbstractAsset<C>, OmittedTokenAssetFields> & TokenAssetFields
    : never
export type BaseAsset<C extends ChainTypes = ChainTypes> = C extends ChainsWithTokenAssets
  ? AbstractAsset<C> & { tokens?: TokenAsset<C>[] }
  : AbstractAsset<C> & { tokens?: never }
// export type BaseAsset<C extends ChainTypes = ChainTypes> = AbstractAsset<C> & {
//   tokens?: C extends ChainsWithTokenAssets ? TokenAsset<C> : never
// }
export type Asset<C extends ChainTypes = ChainTypes> = C extends ChainTypes
  ? AbstractAsset<C> & Partial<TokenAssetFields>
  : never

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

export type MarketDataType = (args: MarketDataArgs) => Promise<MarketData>

export type PriceHistoryType = (args: PriceHistoryArgs) => Promise<HistoryData[]>

// swapper

export enum SwapperType {
  Zrx = '0x',
  Thorchain = 'Thorchain'
}

export type ChainTypesSupportedBySwapperType<S extends SwapperType> = {
  [SwapperType.Zrx]: ChainTypes.Ethereum
  [SwapperType.Thorchain]: ChainTypes
}[S]

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

export type BuildThorTradeOutput = SignTxInput<unknown> & ThorVaultInfo

export type Quote<
  S extends SwapperType,
  C extends ChainTypesSupportedBySwapperType<S> = ChainTypesSupportedBySwapperType<S>
> = {
  success: boolean
  statusCode?: number
  statusReason?: string
  sellAssetAccountId?: string
  buyAssetAccountId?: string
  sellAsset: Asset
  buyAsset: Asset
  feeData?: QuoteFeeData<S, C>
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

type WalletByChainType<C extends ChainTypes> = {
  [ChainTypes.Bitcoin]: BTCWallet
  [ChainTypes.Ethereum]: ETHWallet
}[C]

export type ExecQuoteInput<
  S extends SwapperType,
  C extends ChainTypesSupportedBySwapperType<S> = ChainTypesSupportedBySwapperType<S>
> = S extends SwapperType
  ? C extends ChainTypesSupportedBySwapperType<S>
    ? {
        quote: Quote<S, C>
        wallet: WalletByChainType<C>
      }
    : never
  : never
export type ExecQuoteOutput = {
  txid: string
}

export type ApprovalNeededInput<
  S extends SwapperType,
  C extends ChainTypesSupportedBySwapperType<S> = ChainTypesSupportedBySwapperType<S>
> = ExecQuoteInput<S, C>

export type ApprovalNeededOutput = {
  approvalNeeded: boolean
  gas?: string
  gasPrice?: string
}

export type ApproveInfiniteInput<
  S extends SwapperType,
  C extends ChainTypesSupportedBySwapperType<S> = ChainTypesSupportedBySwapperType<S>
> = ExecQuoteInput<S, C>
