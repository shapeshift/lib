import {
  FiatPriceHistoryType,
  FindAllMarketType,
  FindByCaip19MarketType,
  FindByFiatMarketType,
  PriceHistoryType
} from '@shapeshiftoss/types'

export interface MarketService {
  baseUrl: string
  findAll: FindAllMarketType
  findPriceHistoryByCaip19: PriceHistoryType
  findByCaip19: FindByCaip19MarketType
}

export interface FiatMarketService {
  baseUrl: string
  findPriceHistoryByFiatSymbol: FiatPriceHistoryType
  findByFiatSymbol: FindByFiatMarketType
}
