import { ChainTypes } from './common'

export type Data = {
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

export type DataArgs = {
  chain: ChainTypes
  tokenId?: string
}

export type DataType = (args: DataArgs) => Promise<Data>

export type PriceHistoryType = (args: PriceHistoryArgs) => Promise<HistoryData[]>
