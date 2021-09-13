import { CoinGeckoMarketService } from './coingecko/coingecko'

export enum ChainTypes {
  Ethereum = 'ethereum',
  Bitcoin = 'bitcoin',
  Litecoin = 'litecoin'
}

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

type MarketDataType = (chain: ChainTypes, tokenId?: string) => Promise<MarketData | null>

type PriceHistoryType = (
  name: ChainTypes,
  timeframe: HistoryTimeframe,
  tokenId?: string
) => Promise<HistoryData[]>

export interface MarketService {
  baseUrl: string

  getMarketData: MarketDataType

  getPriceHistory: PriceHistoryType
}

export const getDefaultMarketService = (): MarketService => {
  return new CoinGeckoMarketService()
}

export const getMarketData: MarketDataType = async (network, tokenId) => {
  return getDefaultMarketService().getMarketData(network, tokenId)
}

export const getPriceHistory: PriceHistoryType = (
  chain,
  timeline,
  tokenId
): Promise<HistoryData[]> => {
  return getDefaultMarketService().getPriceHistory(chain, timeline, tokenId)
}
