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

/**
 * stackedQ: We need the list in the frontend,
 * and there's no way to convert an union type to an array,
 * so the list is defined as an array of strings,
 * but SupportedFiatCurrencies is an union of strings
 */
export const SupportedFiatCurrenciesList = [
  'CNY',
  'USD',
  'EUR',
  'JPY',
  'GBP',
  'KRW',
  'INR',
  'CAD',
  'HKD',
  'AUD',
  'TWD',
  'BRL',
  'CHF',
  'THB',
  'MXN',
  'RUB',
  'SAR',
  'SGD',
  'ILS',
  'IDR'
] as const

export type SupportedFiatCurrencies = typeof SupportedFiatCurrenciesList[number]

export type FiatMarketDataArgs = {
  symbol: SupportedFiatCurrencies
}

export type FiatPriceHistoryArgs = {
  symbol: SupportedFiatCurrencies
  timeframe: HistoryTimeframe
}

export type FindByFiatMarketType = (args: FiatMarketDataArgs) => Promise<MarketData | null>

export type FiatPriceHistoryType = (args: FiatPriceHistoryArgs) => Promise<HistoryData[]>
