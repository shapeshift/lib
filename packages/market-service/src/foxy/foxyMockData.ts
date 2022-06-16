// @ts-nocheck FIXME
import { CoinCapMarketCap } from '../coincap/coincap-types'

export const fox: CoinCapMarketCap = {
  market_data: {
    id: 'fox-token',
    rank: '327',
    symbol: 'FOX',
    name: 'FOX Token',
    circulating_supply: '272087306.9154830000000000',
    max_supply: '1000001337.0000000000000000',
    market_cap: { usd: '76043211.3383411704757409' },
    current_price: { usd: '0.2794809217688426' },
    price_change_percentage_24h: 2.810767605208474
  }
}

export const mockFoxyMarketData = {
  changePercent24Hr: 2.810767605208474,
  marketCap: '0',
  price: '0.2794809217688426',
  volume: '0',
  supply: '52018758.965754575223841191',
  maxSupply: '52018758.965754575223841191'
}

export const mockFoxyPriceHistoryData = [
  { time: 1623110400000, priceUsd: 0.480621954029937 },
  { time: 1623196800000, priceUsd: 0.48541321175453755 },
  { time: 1623283200000, priceUsd: 0.4860349080635926 },
  { time: 1623369600000, priceUsd: 0.46897407484696146 },
  { time: 1623456000000, priceUsd: 0.4569204315609752 }
]
