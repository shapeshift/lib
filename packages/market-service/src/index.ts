import { CoinGeckoMarketService } from './coingecko/coingecko'
import { marketService } from '@shapeshiftoss/types'

export interface MarketService {
  baseUrl: string
  getMarketData: marketService.DataType
  getPriceHistory: marketService.PriceHistoryType
}

export const getDefaultMarketService = (): MarketService => {
  return new CoinGeckoMarketService()
}

export const getMarketData: marketService.DataType = async ({
  chain,
  tokenId
}: marketService.DataArgs) => {
  return getDefaultMarketService().getMarketData({ chain, tokenId })
}

export const getPriceHistory: marketService.PriceHistoryType = ({
  chain,
  timeframe,
  tokenId
}: marketService.PriceHistoryArgs): Promise<marketService.HistoryData[]> => {
  return getDefaultMarketService().getPriceHistory({ chain, timeframe, tokenId })
}
