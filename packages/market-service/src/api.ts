import { GetByMarketCapType, MarketDataType, PriceHistoryType } from '@shapeshiftoss/types'

export interface MarketService {
  baseUrl: string
  getMarketData: MarketDataType
  getPriceHistory: PriceHistoryType
  getByMarketCap: GetByMarketCapType
}

export enum MarketServiceEnum {
  COIN_GECKO = 'coingecko',
  COIN_CAP = 'coincap'
}

export interface MarketServices {
  [MarketServiceEnum.COIN_GECKO]: MarketService
  [MarketServiceEnum.COIN_CAP]: MarketService
}
