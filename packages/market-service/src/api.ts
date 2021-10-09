import { GetByMarketCapType, MarketDataType, PriceHistoryType } from '@shapeshiftoss/types'

export interface MarketService {
  getMarketData: MarketDataType
  getPriceHistory: PriceHistoryType
  getByMarketCap: GetByMarketCapType
}
