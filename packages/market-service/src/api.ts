import { findAllMarketType, findByCaip19MarketType, PriceHistoryType } from '@shapeshiftoss/types'

export interface MarketService {
  baseUrl: string
  findAll: findAllMarketType
  findPriceHistoryByCaip19: PriceHistoryType
  findByCaip19: findByCaip19MarketType
}
