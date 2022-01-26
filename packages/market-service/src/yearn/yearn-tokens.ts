import { adapters } from '@shapeshiftoss/caip'
import { toCAIP19 } from '@shapeshiftoss/caip/dist/caip19/caip19'
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
import { ChainId, Token, Yearn } from '@yfi/sdk'
import head from 'lodash/head'
// import last from 'lodash/last'
import uniqBy from 'lodash/uniqBy'

import { MarketService } from '../api'
import { bn, bnOrZero } from '../utils/bignumber'
import { ACCOUNT_HISTORIC_EARNINGS } from './gql-queries'
import { VaultDayDataGQLResponse } from './yearn-types'

type YearnTokenMarketCapServiceArgs = {
  yearnSdk: Yearn<ChainId>
}

const USDC_PRECISION = 6

export class YearnTokenMarketCapService implements MarketService {
  baseUrl = 'https://api.yearn.finance'
  yearnSdk: Yearn<ChainId>

  private readonly defaultGetByMarketCapArgs: FindAllMarketArgs = {
    count: 2500
  }

  constructor(args: YearnTokenMarketCapServiceArgs) {
    this.yearnSdk = args.yearnSdk
  }

  findAll = async (args?: FindAllMarketArgs) => {
    try {
      const argsToUse = { ...this.defaultGetByMarketCapArgs, ...args }
      const response = await Promise.allSettled([
        this.yearnSdk.ironBank.tokens(),
        this.yearnSdk.tokens.supported(),
        this.yearnSdk.vaults.tokens()
      ])
      const [ironBankResponse, zapperResponse, underlyingTokensResponse] = response

      // Ignore rejected promises, return successful responses.
      const responseTokens = [
        ...(ironBankResponse.status === 'fulfilled' ? ironBankResponse.value : []),
        ...(zapperResponse.status === 'fulfilled' ? zapperResponse.value : []),
        ...(underlyingTokensResponse.status === 'fulfilled' ? underlyingTokensResponse.value : [])
      ]
      const uniqueTokens: Token[] = uniqBy(responseTokens, 'address')
      const tokens = uniqueTokens.slice(0, argsToUse.count)

      return tokens.reduce((acc, token) => {
        const caip19: string = toCAIP19({
          chain: ChainTypes.Ethereum,
          network: NetworkTypes.MAINNET,
          contractType: ContractTypes.ERC20,
          tokenId: token.address
        })
        acc[caip19] = {
          price: bnOrZero(token.priceUsdc)
            .div(`1e+${USDC_PRECISION}`)
            .toFixed(2),
          // TODO: figure out how to get these values.
          marketCap: '0',
          volume: '0',
          changePercent24Hr: 0
        }

        return acc
      }, {} as MarketCapResult)
      return {}
    } catch (e) {
      console.info(e)
      return {}
    }
  }

  findByCaip19 = async ({ caip19 }: MarketDataArgs): Promise<MarketData | null> => {
    const address = adapters.CAIP19ToYearn(caip19)
    if (!address) return null
    try {
      const response = await Promise.allSettled([
        this.yearnSdk.ironBank.tokens(),
        this.yearnSdk.tokens.supported(),
        this.yearnSdk.vaults.tokens()
      ])
      const [ironBankResponse, zapperResponse, underlyingTokensResponse] = response

      // Ignore rejected promises, return successful responses.
      const responseTokens = [
        ...(ironBankResponse.status === 'fulfilled' ? ironBankResponse.value : []),
        ...(zapperResponse.status === 'fulfilled' ? zapperResponse.value : []),
        ...(underlyingTokensResponse.status === 'fulfilled' ? underlyingTokensResponse.value : [])
      ]
      const token = responseTokens.find((tok: Token) => tok.address === address)
      if (!token) return null

      return {
        price: bnOrZero(token.priceUsdc)
          .div(`1e+${USDC_PRECISION}`)
          .toFixed(2),
        marketCap: '0',
        volume: '0',
        changePercent24Hr: 0
      }
      return null
    } catch (e) {
      console.warn(e)
      throw new Error('YearnMarketService(findByCaip19): error fetching market data')
    }
  }

  findPriceHistoryByCaip19 = async (): Promise<HistoryData[]> => {
    try {
      // TODO: figure out a way to get zapper, ironbank and underlying token historical data.
      return []
    } catch (e) {
      console.warn(e)
      throw new Error('YearnMarketService(getPriceHistory): error fetching price history')
    }
  }
}
