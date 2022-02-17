import { MarketService } from '../api'
import {
  FindAllMarketArgs,
  HistoryData,
  HistoryTimeframe,
  MarketCapResult,
  MarketData,
  MarketDataArgs,
  PriceHistoryArgs
} from '@shapeshiftoss/types'

export class OsmosisMarketService implements MarketService {
  baseUrl = 'https://api-osmosis.imperator.co/'

  findAll = async (args?: FindAllMarketArgs) => {}

  findByCaip19 = async (args?: MarketDataArgs): Promise<MarketData | null> => {}

  findPriceHistoryByCaip19 = async (args?: PriceHistoryArgs): Promise<HistoryData[]> => {}
}
