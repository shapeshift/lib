import { adapters, CHAIN_REFERENCE, fromAssetId } from '@shapeshiftoss/caip'
import {
  CoingeckoAssetPlatform,
  FindAllMarketArgs,
  HistoryData,
  HistoryTimeframe,
  MarketCapResult,
  MarketData,
  MarketDataArgs,
  PriceHistoryArgs
} from '@shapeshiftoss/types'
import dayjs from 'dayjs'

import { MarketService } from '../api'
import { RATE_LIMIT_THRESHOLDS_PER_MINUTE } from '../config'
import { bn, bnOrZero } from '../utils/bignumber'
import { isValidDate } from '../utils/isValidDate'
import { rateLimitedAxios } from '../utils/rateLimiters'
import { CoinGeckoMarketCap } from './coingecko-types'

const axios = rateLimitedAxios(RATE_LIMIT_THRESHOLDS_PER_MINUTE.COINGECKO)

// tons more params here: https://www.coingecko.com/en/api/documentation
type CoinGeckoAssetData = {
  chain: CoingeckoAssetPlatform
  market_data: {
    current_price: { [key: string]: string }
    market_cap: { [key: string]: string }
    total_volume: { [key: string]: string }
    high_24h: { [key: string]: string }
    low_24h: { [key: string]: string }
    circulating_supply: string
    total_supply: string
    max_supply: string
    price_change_percentage_24h: number
  }
}

type CoinGeckoHistoryData = {
  prices: [number, number][]
}

type CoinGeckoMarketServiceArgs = {
  coinGeckoAPIKey: string
}

export class CoinGeckoMarketService implements MarketService {
  private readonly maxCount = 2500
  private readonly maxPerPage = 250

  baseUrl: string
  APIKey: string

  constructor(args: CoinGeckoMarketServiceArgs) {
    this.APIKey = args.coinGeckoAPIKey
    // if we have a key - use the pro- api
    this.baseUrl = `https://${this.APIKey ? 'pro-' : ''}api.coingecko.com/api/v3`
  }

  private maybeAddAPIKey = (): string => {
    return this.APIKey ? `&x_cg_pro_api_key=${this.APIKey}` : ''
  }

  async findAll(args?: FindAllMarketArgs) {
    const count = args?.count ?? this.maxCount
    const perPage = count < this.maxPerPage ? count : this.maxPerPage
    const pages = Math.ceil(bnOrZero(count).div(perPage).toNumber())

    const urlAtPage = (page: number) =>
      `${
        this.baseUrl
      }/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${perPage}&page=${page}&sparkline=false${this.maybeAddAPIKey()}`

    const pageCount = Array(pages)
      .fill(0)
      .map((_v, i) => i + 1)

    try {
      const marketData = await Promise.all(
        pageCount.map(async (page) => {
          const { data } = await axios.get<CoinGeckoMarketCap>(urlAtPage(page))
          return data ?? []
        })
      )

      return marketData.flat().reduce<MarketCapResult>((prev, asset) => {
        const assetId = adapters.coingeckoToAssetId(asset.id)
        if (!assetId) return prev

        prev[assetId] = {
          price: asset.current_price.toString(),
          marketCap: asset.market_cap.toString(),
          volume: asset.total_volume.toString(),
          changePercent24Hr: asset.price_change_percentage_24h,
          supply: asset.circulating_supply.toString(),
          maxSupply: asset.max_supply ? asset.max_supply.toString() : asset.total_supply?.toString()
        }

        return prev
      }, {})
    } catch (e) {
      return {}
    }
  }

  async findByAssetId({ assetId }: MarketDataArgs): Promise<MarketData | null> {
    try {
      if (!adapters.assetIdToCoingecko(assetId)) return null

      const url = this.makeCoinsUrl(assetId)
      if (!url) return null

      const { data }: { data: CoinGeckoAssetData } = await axios.get(
        `${url}?${this.maybeAddAPIKey}`
      )

      const currency = 'usd'
      const marketData = data?.market_data

      if (!marketData) return null

      /* max_supply may be null on coingecko while available on other sources (coincap)
      hence choosing to take value from total_supply if existing
      Also a lot of time when max_supply is null, total_supply is the maximum supply on coingecko
      We can reassess in the future the degree of precision we want on that field */
      return {
        price: marketData.current_price[currency],
        marketCap: marketData.market_cap[currency],
        changePercent24Hr: marketData.price_change_percentage_24h,
        volume: marketData.total_volume[currency],
        supply: marketData.circulating_supply,
        maxSupply: marketData.max_supply ?? marketData.total_supply ?? undefined
      }
    } catch (e) {
      console.warn(e)
      throw new Error('CoinGeckoMarketService(findByAssetId): error fetching market data')
    }
  }

  async findPriceHistoryByAssetId({
    assetId,
    timeframe
  }: PriceHistoryArgs): Promise<HistoryData[]> {
    if (!adapters.assetIdToCoingecko(assetId)) return []

    const url = this.makeCoinsUrl(assetId)
    if (!url) return []

    try {
      const end = dayjs().startOf('minute')
      const start = (() => {
        switch (timeframe) {
          case HistoryTimeframe.HOUR:
            return end.subtract(1, 'hour')
          case HistoryTimeframe.DAY:
            return end.subtract(1, 'day')
          case HistoryTimeframe.WEEK:
            return end.subtract(1, 'week')
          case HistoryTimeframe.MONTH:
            return end.subtract(1, 'month')
          case HistoryTimeframe.YEAR:
            return end.subtract(1, 'year')
          case HistoryTimeframe.ALL:
            return end.subtract(20, 'years')
          default:
            return end
        }
      })()

      const currency = 'usd'
      const from = start.valueOf() / 1000
      const to = end.valueOf() / 1000

      const { data: historyData } = await axios.get<CoinGeckoHistoryData>(
        `${url}/market_chart/range?vs_currency=${currency}&from=${from}&to=${to}${this.maybeAddAPIKey()}`
      )

      return historyData.prices.reduce<HistoryData[]>((prev, data) => {
        const [date, price] = data

        if (!isValidDate(date)) {
          console.error('Coingecko asset has invalid date')
          return prev
        }

        if (bn(price).isNaN()) {
          console.error('Coingecko asset has invalid price')
          return prev
        }

        prev.push({ date, price })
        return prev
      }, [])
    } catch (e) {
      console.warn(e)
      throw new Error(
        'CoinGeckoMarketService(findPriceHistoryByAssetId): error fetching price history'
      )
    }
  }

  private makeCoinsUrl(assetId: string): string | undefined {
    const id = adapters.assetIdToCoingecko(assetId)
    if (!id) return

    const { chainReference, assetNamespace, assetReference } = fromAssetId(assetId)

    if (assetNamespace === 'erc20') {
      const assetPlatform = (() => {
        switch (chainReference) {
          case CHAIN_REFERENCE.EthereumMainnet:
            return CoingeckoAssetPlatform.Ethereum
          case CHAIN_REFERENCE.AvalancheCChain:
            return CoingeckoAssetPlatform.Avalanche
          default:
            throw new Error(
              `no supported coingecko asset platform for chain reference: ${chainReference}`
            )
        }
      })()

      return `${this.baseUrl}/coins/${assetPlatform}/contract/${assetReference}`
    }

    return `${this.baseUrl}/coins/${id}`
  }
}
