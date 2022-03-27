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
  date: number
}

export type PriceHistoryArgs = {
  caip19: string
  timeframe: HistoryTimeframe
}

export type MarketDataArgs = {
  caip19: string
}

export type FindAllMarketType = (args: FindAllMarketArgs) => Promise<MarketCapResult>
export type FindByCaip19MarketType = (args: MarketDataArgs) => Promise<MarketData | null>

export type PriceHistoryType = (args: PriceHistoryArgs) => Promise<HistoryData[]>

export type FindAllMarketArgs = {
  count: number
}

export type MarketCapResult = {
  [k: string]: MarketData
}

export enum SupportedFiatCurrencies {
  CNY = 'CNY',
  USD = 'USD',
  EUR = 'EUR',
  JPY = 'JPY',
  GBP = 'GBP',
  KRW = 'KRW',
  INR = 'INR',
  CAD = 'CAD',
  HKD = 'HKD',
  AUD = 'AUD',
  TWD = 'TWD',
  BRL = 'BRL',
  CHF = 'CHF',
  THB = 'THB',
  MXN = 'MXN',
  RUB = 'RUB',
  SAR = 'SAR',
  SGD = 'SGD',
  ILS = 'ILS',
  IDR = 'IDR'
}

export type FiatMarketDataArgs = {
  symbol: SupportedFiatCurrencies
}

export type FiatPriceHistoryArgs = {
  symbol: SupportedFiatCurrencies
  timeframe: HistoryTimeframe
}
