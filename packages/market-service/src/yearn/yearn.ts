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
import { ChainId, Yearn } from '@yfi/sdk'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'
import head from 'lodash/head'

import { MarketService } from '../api'
import { ACCOUNT_HISTORIC_EARNINGS } from './gql-queries'
import { VaultDayDataGQLResponse } from './yearn-types'

// TODO: fix this to represent yearn data
// type YearnAssetData = {
//   chain: ChainTypes
//   market_data: {
//     current_price: { [key: string]: string }
//     market_cap: { [key: string]: string }
//     total_volume: { [key: string]: string }
//     high_24h: { [key: string]: string }
//     low_24h: { [key: string]: string }
//     total_supply: string
//     max_supply: string
//     price_change_percentage_24h: number
//   }
// }

type YearnMarketCapServiceArgs = {
  yearnSdk: Yearn<ChainId>
}

export class YearnMarketCapService implements MarketService {
  baseUrl = 'https://api.yearn.finance'
  yearnSdk: Yearn<ChainId>

  private readonly defaultGetByMarketCapArgs: FindAllMarketArgs = {
    count: 2500
  }

  constructor(args: YearnMarketCapServiceArgs) {
    this.yearnSdk = args.yearnSdk
  }

  findAll = async (args?: FindAllMarketArgs) => {
    try {
      const argsToUse = { ...this.defaultGetByMarketCapArgs, ...args }
      const response = await this.yearnSdk.vaults.get()
      const vaults = response.splice(0, argsToUse.count)
      // Vault token price (when total asssets inside is 0 (calculate underlying asset price)): underlyingTokenBalance.amountUsdc / underlyingTokenBalance.amount
      // Acutal vault token price: underlying token price * (pricePerShare / (1e+decimals of vault asset))
      // MarketCap:  vault.underlyingTokenBalance.amountUsdc
      // Volume:  last historical earnings - second to last historical earnings
      // Change24: volume / last historical earnings

      // vault.underlyingTokenBalance.amount - total holdings of underlying asset inside the vault
      // vault.underlyingTokenBalance.amountUsdc - marketCap of vault
      return vaults
        .sort((a, b) =>
          new BigNumber(a.underlyingTokenBalance.amountUsdc).lt(b.underlyingTokenBalance.amountUsdc)
            ? 1
            : -1
        )
        .reduce((acc, yearnItem) => {
          const caip19: string = toCAIP19({
            chain: ChainTypes.Ethereum,
            network: NetworkTypes.MAINNET,
            contractType: ContractTypes.ERC20,
            tokenId: yearnItem.address
          })
          // if amountUsdc of a yearn asset is 0, the asset has not price or value
          if (new BigNumber(yearnItem.underlyingTokenBalance.amountUsdc).eq(0)) {
            acc[caip19] = {
              price: '0',
              marketCap: '0',
              volume: '0',
              changePercent24Hr: 0
            }

            return acc
          }

          let volume = new BigNumber('0')
          let changePercent24Hr = 0

          const price = new BigNumber(yearnItem.underlyingTokenBalance.amountUsdc)
            .div('1e+6')
            .div(yearnItem.underlyingTokenBalance.amount)
            .times(`1e+${yearnItem.decimals}`)
            .times(yearnItem.metadata.pricePerShare)
            .div(`1e+${yearnItem.decimals}`)
            .toFixed(2)

          const marketCap = new BigNumber(yearnItem.underlyingTokenBalance.amountUsdc)
            .div('1e+6')
            .toFixed(2)

          const historicEarnings = yearnItem.metadata.historicEarnings
          const lastHistoricalEarnings = historicEarnings
            ? historicEarnings[historicEarnings.length - 1]
            : null
          const secondToLastHistoricalEarnings = historicEarnings
            ? historicEarnings[historicEarnings.length - 2]
            : null
          if (lastHistoricalEarnings && secondToLastHistoricalEarnings) {
            volume = new BigNumber(lastHistoricalEarnings.earnings.amountUsdc).minus(
              secondToLastHistoricalEarnings.earnings.amountUsdc
            )
          }

          if (lastHistoricalEarnings) {
            changePercent24Hr =
              volume
                .div(lastHistoricalEarnings.earnings.amountUsdc)
                .div('1e+6')
                .toNumber() || 0
          }

          acc[caip19] = {
            price,
            marketCap,
            volume: volume.abs().toString(),
            changePercent24Hr
          }

          return acc
        }, {} as MarketCapResult)
    } catch (e) {
      console.info(e)
      return {}
    }
  }

  findByCaip19 = async ({ caip19 }: MarketDataArgs): Promise<MarketData | null> => {
    try {
      const { tokenId } = fromCAIP19(caip19)
      if (!tokenId) return null
      const checksumAddress = ethers.utils.getAddress(tokenId)
      const vaults = await this.yearnSdk.vaults.get([checksumAddress])
      if (!vaults || !vaults.length) return null
      const vault = head(vaults)
      if (!vault) return null

      if (new BigNumber(vault.underlyingTokenBalance.amountUsdc).eq(0)) {
        return {
          price: '0',
          marketCap: '0',
          volume: '0',
          changePercent24Hr: 0
        }
      }

      let volume = new BigNumber('0')
      let changePercent24Hr = 0

      const price = new BigNumber(vault.underlyingTokenBalance.amountUsdc)
        .div('1e+6')
        .div(vault.underlyingTokenBalance.amount)
        .times(`1e+${vault.decimals}`)
        .times(vault.metadata.pricePerShare)
        .div(`1e+${vault.decimals}`)
        .toFixed(2)

      const marketCap = new BigNumber(vault.underlyingTokenBalance.amountUsdc)
        .div('1e+6')
        .toFixed(2)

      const historicEarnings = vault.metadata.historicEarnings
      const lastHistoricalEarnings = historicEarnings
        ? historicEarnings[historicEarnings.length - 1]
        : null
      const secondToLastHistoricalEarnings = historicEarnings
        ? historicEarnings[historicEarnings.length - 2]
        : null
      if (lastHistoricalEarnings && secondToLastHistoricalEarnings) {
        volume = new BigNumber(lastHistoricalEarnings.earnings.amountUsdc)
          .minus(secondToLastHistoricalEarnings.earnings.amountUsdc)
          .div('1e+6')
          .dp(2)
      }

      if (lastHistoricalEarnings) {
        changePercent24Hr =
          volume
            .div(lastHistoricalEarnings.earnings.amountUsdc)
            .times('1e+6')
            .toNumber() || 0
      }

      return {
        price,
        marketCap,
        volume: volume.abs().toString(),
        changePercent24Hr
      }
    } catch (e) {
      console.warn(e)
      throw new Error('MarketService(getMarketData): error fetching market data')
    }
  }

  private getDate(daysAgo: number) {
    const date = new Date()
    date.setDate(date.getDate() - daysAgo)
    return date
  }

  findPriceHistoryByCaip19 = async ({
    caip19,
    timeframe
  }: PriceHistoryArgs): Promise<HistoryData[]> => {
    const { tokenId } = fromCAIP19(caip19)
    if (!tokenId) return []
    const checksumAddress = ethers.utils.getAddress(tokenId)

    let daysAgo
    switch (timeframe) {
      case HistoryTimeframe.HOUR:
        daysAgo = 2
        break
      case HistoryTimeframe.DAY:
        daysAgo = 3
        break
      case HistoryTimeframe.WEEK:
        daysAgo = 7
        break
      case HistoryTimeframe.MONTH:
        daysAgo = 30
        break
      case HistoryTimeframe.YEAR:
        daysAgo = 365
        break
      case HistoryTimeframe.ALL:
        daysAgo = 3650
        break
      default:
        daysAgo = 1
    }

    try {
      const vaults = await this.yearnSdk.vaults.get([checksumAddress])
      const decimals = vaults[0].decimals

      const response: VaultDayDataGQLResponse = await this.yearnSdk.services.subgraph.fetchQuery(
        ACCOUNT_HISTORIC_EARNINGS,
        {
          id: checksumAddress,
          shareToken: checksumAddress,
          fromDate: this.getDate(daysAgo)
            .getTime()
            .toString(),
          toDate: this.getDate(0)
            .getTime()
            .toString()
        }
      )

      type VaultDayData = {
        pricePerShare: string
        timestamp: string
        tokenPriceUSDC: string
      }
      const vaultDayData: VaultDayData[] =
        response.data.account.vaultPositions[0].vault.vaultDayData

      return vaultDayData.map((datum: VaultDayData) => {
        return {
          date: datum.timestamp,
          price: new BigNumber(datum.tokenPriceUSDC)
            .div(`1e+6`)
            .times(datum.pricePerShare)
            .div(`1e+${decimals}`)
            .dp(6)
            .toNumber()
        }
      })
    } catch (e) {
      console.warn(e)
      throw new Error('MarketService(getPriceHistory): error fetching price history')
    }
  }
}
