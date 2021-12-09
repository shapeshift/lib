import { Yearn, ChainId } from '@yfi/sdk'
import { adapters } from '@shapeshiftoss/caip'
import { fromCAIP19, toCAIP19 } from '@shapeshiftoss/caip/dist/caip19/caip19'
import {
  ChainTypes,
  ContractTypes,
  FindAllMarketArgs,
  HistoryData,
  HistoryTimeframe,
  MarketCapResult,
  MarketData,
  MarketDataArgs,
  NetworkTypes,
  PriceHistoryArgs
} from '@shapeshiftoss/types'
import axios from 'axios'
import dayjs from 'dayjs'
import omit from 'lodash/omit'

import { MarketService } from '../api'
import { YearnMarketCap } from './yearn-types'

// TODO: fix this to represent yearn data
type YearnAssetData = {
  chain: ChainTypes
  market_data: {
    current_price: { [key: string]: string }
    market_cap: { [key: string]: string }
    total_volume: { [key: string]: string }
    high_24h: { [key: string]: string }
    low_24h: { [key: string]: string }
    total_supply: string
    max_supply: string
    price_change_percentage_24h: number
  }
}

type YearnMarketCapServiceArgs = {
  yearnSdk: Yearn<ChainId>
}

export class YearnMarketCapService implements MarketService {
  baseUrl = 'https://api.yearn.finance'
  yearnSdk: Yearn<ChainId>

  private readonly defaultGetByMarketCapArgs: FindAllMarketArgs = {
    pages: 10,
    perPage: 250
  }

  constructor(args: YearnMarketCapServiceArgs) {
    this.yearnSdk = args.yearnSdk
  }

  findAll = async (args?: FindAllMarketArgs) => {
    const url = `${this.baseUrl}/v1/chains/1/vaults/all`
    try {
      const { data } = await axios.get<YearnMarketCap[]>(url)
      // const assets = await this.yearnSdk.services.lens.adapters.vaults.v2.tokens()
      // console.log({ assets })
      return data
        .sort((a, b) => (a.tvl.tvl > b.tvl.tvl ? 1 : -1))
        .reduce((acc, yearnItem) => {
          const caip19: string = toCAIP19({
            chain: ChainTypes.Ethereum,
            network: NetworkTypes.MAINNET,
            contractType: ContractTypes.ERC20,
            tokenId: yearnItem.address
          })

          acc[caip19] = {
            price: '10',
            marketCap: '10',
            volume: '10',
            changePercent24Hr: 10
          }

          return acc
        }, {} as MarketCapResult)

      // const marketCapData = data.reduce((acc, yearnData) => {

      // }, {})
      // const yearnItem = data[0]
      // console.dir({ yearnMarketData }, { color: true, depth: 4 })
      // return {
      //   ['caip19']: {
      //     price: '10',
      //     marketCap: '10',
      //     volume: '10',
      //     changePercent24Hr: 10
      //   }
      // } as MarketCapResult
      // const combined = (
      //   await Promise.all(
      //     pageCount.map(async (page) => axios.get<YearnMarketCap>(url))
      //   )
      // ).flat()
      // return combined
      //   .map(({ data }) => data ?? []) // filter out rate limited results
      //   .flat()
      //   .sort((a, b) => (a.market_cap_rank > b.market_cap_rank ? 1 : -1))
      //   .reduce((acc, cur) => {
      //     const { id } = cur
      //     try {
      //       const caip19 = adapters.coingeckoToCAIP19(id)
      //       const curWithoutId = omit(cur, 'id') // don't leak this through to clients
      //       acc[caip19] = {
      //         price: curWithoutId.current_price.toString(),
      //         marketCap: curWithoutId.market_cap.toString(),
      //         volume: curWithoutId.total_volume.toString(),
      //         changePercent24Hr: curWithoutId.price_change_percentage_24h
      //       }
      //       return acc
      //     } catch {
      //       return acc // no caip found, we don't support this asset
      //     }
      //   }, {} as MarketCapResult)
    } catch (e) {
      console.log(e)
      return {}
    }
  }

  findByCaip19 = async ({ caip19 }: MarketDataArgs): Promise<MarketData> => {
    try {
      const { tokenId } = fromCAIP19(caip19)
      const isToken = !!tokenId
      const contractUrl = isToken ? `/contract/${tokenId}` : ''

      const { data }: { data: YearnAssetData } = await axios.get(
        `${this.baseUrl}/coins/${tokenId}${contractUrl}`
      )

      // TODO: get correct localizations
      const currency = 'usd'
      const marketData = data?.market_data
      return {
        price: marketData?.current_price?.[currency],
        marketCap: marketData?.market_cap?.[currency],
        changePercent24Hr: marketData?.price_change_percentage_24h,
        volume: marketData?.total_volume?.[currency]
      }
    } catch (e) {
      console.warn(e)
      throw new Error('MarketService(getMarketData): error fetching market data')
    }
  }

  findPriceHistoryByCaip19 = async ({
    caip19,
    timeframe
  }: PriceHistoryArgs): Promise<HistoryData[]> => {
    // TODO: Figure out how to get price history data for yAssets
    const { tokenId } = fromCAIP19(caip19)
    const id = tokenId

    const end = dayjs().startOf('minute')
    let start
    switch (timeframe) {
      case HistoryTimeframe.HOUR:
        start = end.subtract(1, 'hour')
        break
      case HistoryTimeframe.DAY:
        start = end.subtract(1, 'day')
        break
      case HistoryTimeframe.WEEK:
        start = end.subtract(1, 'week')
        break
      case HistoryTimeframe.MONTH:
        start = end.subtract(1, 'month')
        break
      case HistoryTimeframe.YEAR:
        start = end.subtract(1, 'year')
        break
      case HistoryTimeframe.ALL:
        start = end.subtract(20, 'years')
        break
      default:
        start = end
    }

    try {
      const from = start.valueOf() / 1000
      const to = end.valueOf() / 1000
      const contract = tokenId ? `/contract/${tokenId}` : ''
      const url = `${this.baseUrl}/coins/${id}${contract}`
      // TODO: change vs_currency to localized currency
      const currency = 'usd'
      const { data: historyData } = await axios.get(
        `${url}/market_chart/range?id=${id}&vs_currency=${currency}&from=${from}&to=${to}`
      )
      return historyData?.prices?.map((data: [string, number]) => {
        return {
          date: data[0],
          price: data[1]
        }
      })
    } catch (e) {
      console.warn(e)
      throw new Error('MarketService(getPriceHistory): error fetching price history')
    }
  }
}
