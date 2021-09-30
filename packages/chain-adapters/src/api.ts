import {
  BTCSignTx,
  HDWallet,
  BTCInputScriptType,
  ETHSignTx,
  BTCSignTxNative
} from '@shapeshiftoss/hdwallet-core'
import { NativeHDWallet } from '@shapeshiftoss/hdwallet-native'
import { Ethereum, Bitcoin } from '@shapeshiftoss/unchained-client'

export type Transaction = {
  network: string
  symbol: string
  txid: string
  status: string
  from: string
  to: string
  blockHash: string
  blockHeight: number
  confirmations: number
  timestamp: number
  value: string
  fee: string
}

export type TxHistoryResponse = {
  page: number
  totalPages: number
  txs: number
  transactions: Transaction[]
}

export type Token = {
  type: string
  name: string
  path?: string
  contract?: string
  transfers: number
  symbol?: string
  decimals?: number
  balance?: string
  totalReceived?: string
  totalSent?: string
}

export type AccountResponse = {
  network: string
  symbol: string
  address: string
  balance: string
  unconfirmedBalance: string
  unconfirmedTxs: number
  txs: number
  tokens: Token[]
}

export type UtxoResponse = {
  txid: string
  vout: number
  value: string | number
  height?: number
  confirmations: number
  address?: string
  path: string
  locktime?: number
  coinbase?: boolean
  nonWitnessUtxo?: string
}

export type GetAddressParams = {
  wallet: NativeHDWallet
  purpose: string
  account: string
  isChange?: boolean
  index?: number
  scriptType?: BTCInputScriptType
}

export type BroadcastTxResponse = {
  network: string
  txid: string
}

export type Asset = {
  id: string
  symbol: string
}

export type Recipient = {
  value: number
  address?: string
}

export type BuildSendTxInput = {
  asset: Asset
  to?: string
  value?: string
  wallet: NativeHDWallet
  path?: string
  /*** In base units */
  fee?: string
  /*** Optional param for eth txs indicating what ERC20 is being sent */
  erc20ContractAddress?: string
  limit?: string
  memo?: string
  recipients?: Recipient[]
  opReturnData?: string
}

export type SignEthTxInput = {
  txToSign: ETHSignTx
  wallet: NativeHDWallet
}

export type SignBitcoinTxInput = {
  txToSign: BTCSignTxNative
  wallet: NativeHDWallet
}

export type GetAddressInput = {
  wallet: HDWallet
  path?: string
  purpose?: string
  account?: string
  isChange?: boolean
  index?: number
  scriptType?: BTCInputScriptType
}

export type GetFeeDataInput = {
  contractAddress?: string
  from: string
  to: string
  value: string
}

export enum ETHFeeDataKey {
  Slow = 'slow',
  Average = 'average',
  Fast = 'fast'
}

export type ETHFeeDataType = {
  feeUnitPrice: string
  networkFee: string
  feeUnits: string
}

export type ETHFeeData = {
  [ETHFeeDataKey.Slow]: ETHFeeDataType
  [ETHFeeDataKey.Average]: ETHFeeDataType
  [ETHFeeDataKey.Fast]: ETHFeeDataType
}

export enum BTCFeeDataKey {
  Fastest = 'fastest',
  HalfHour = 'halfHour',
  OneHour = '1hour',
  SixHour = '6hour',
  TwentyFourHour = '24hour'
}

export type BTCFeeDataType = {
  minMinutes: number
  maxMinutes: number
  effort: number
  fee?: number
}

export type BTCFeeData = {
  [BTCFeeDataKey.Fastest]: BTCFeeDataType
  [BTCFeeDataKey.HalfHour]: BTCFeeDataType
  [BTCFeeDataKey.OneHour]: BTCFeeDataType
  [BTCFeeDataKey.SixHour]: BTCFeeDataType
  [BTCFeeDataKey.TwentyFourHour]: BTCFeeDataType
}

export type FeeData = ETHFeeData | BTCFeeData

export enum ChainIdentifier {
  'Ethereum' = 'ethereum',
  'Bitcoin' = 'bitcoin'
}

export enum ValidAddressResultType {
  Valid = 'valid',
  Invalid = 'invalid'
}

export type ValidAddressResult = {
  /**
   * Is this Address valid
   */
  valid: boolean
  /**
   * Result type of valid address
   */
  result: ValidAddressResultType
}

export type FeeEstimateInput = {
  to: string
  from: string
  data: string
  value: string
}

export type Params = {
  pageNum?: number
  pageSize?: number
  contract?: string
}

type ConfTimeOption = {
  minMinutes: number
  maxMinutes: number
  effort: number
  fee?: number
}

export interface ConfTimeOptions {
  [index: string]: ConfTimeOption
}
export interface ChainAdapter {
  /**
   * Get type of adapter
   */
  getType(): ChainIdentifier

  /**
   * Get the balance of an address
   */
  getAccount(pubkey: string): Promise<Ethereum.EthereumAccount | Bitcoin.BitcoinAccount>

  /**
   * Get Transaction History for an address
   */
  getTxHistory(address: string, params?: Params): Promise<Ethereum.TxHistory | Bitcoin.TxHistory>

  buildSendTransaction(
    input: BuildSendTxInput
  ): Promise<{ txToSign: BTCSignTx | ETHSignTx; estimatedFees?: FeeData } | undefined>

  getAddress(input: GetAddressInput): Promise<string | undefined>

  signTransaction(signTxInput: SignBitcoinTxInput | SignEthTxInput): Promise<string>

  getFeeData(input: Partial<GetFeeDataInput>): Promise<FeeData>

  broadcastTransaction(hex: string): Promise<string>

  validateAddress(address: string): Promise<ValidAddressResult>
}
