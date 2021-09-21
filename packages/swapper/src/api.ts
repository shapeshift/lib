import { HDWallet } from '@shapeshiftoss/hdwallet-core'

export enum SwapperType {
  Zrx = '0x',
  Thorchain = 'Thorchain'
}

type AssetType = {
  tokenId: string
  symbol: string
  network: string
}

export class SwapError extends Error {}

export interface GetQuoteInput {
  sellAsset: AssetType
  buyAsset: AssetType
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

export interface FeeData {
  fee?: string
  gas?: string
  estimatedGas?: string
  gasPrice?: string
  approvalFee?: string
  protocolFee?: string
  minimumProtocolFee?: string
  receiveNetworkFee?: string
}

export type SwapSource = {
  name: string
  proportion: string
}

export interface Quote {
  success: boolean
  statusCode?: number
  statusReason?: string
  sellAssetAccountId?: string
  buyAssetAccountId?: string
  sellAsset: AssetType
  buyAsset: AssetType
  rate?: string
  depositAddress?: string // this is dex contract address for eth swaps
  receiveAddress?: string
  buyAmount?: string
  sellAmount?: string
  minimum?: string | null
  maximum?: string | null
  guaranteedPrice?: string
  slipScore?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  txData?: any // unsigned tx if available at quote time
  value?: string
  feeData?: FeeData
  allowanceContract?: string
  allowanceGrantRequired?: boolean
  slippage?: string
  priceImpact?: string
  orderId?: string
  sources?: Array<SwapSource>
  timestamp?: number
}

export interface Swapper {
  /** Returns the swapper type */
  getType(): SwapperType

  /**
  * Get a Quote along with an unsigned transaction that can be signed and broadcast to execute the swap
  * @param input
  * @param wallet
  **/
  buildQuoteTx?(input: GetQuoteInput, wallet: HDWallet): Promise<Quote>
}
