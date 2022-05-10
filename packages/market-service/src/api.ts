import { FindAllMarketType, FindByCaip19MarketType, PriceHistoryType } from '@shapeshiftoss/types'

import { FiatPriceHistoryType, FindByFiatMarketType } from './fiat-market-service-types'

export interface MarketService {
  baseUrl: string
  findAll: FindAllMarketType
  findPriceHistoryByAssetId: PriceHistoryType
  findByAssetId: FindByCaip19MarketType
}

export interface FiatMarketService {
  baseUrl: string
  findPriceHistoryByFiatSymbol: FiatPriceHistoryType
  findByFiatSymbol: FindByFiatMarketType
}
