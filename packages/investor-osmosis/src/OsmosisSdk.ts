import axios from 'axios'
import BigNumber from 'bignumber.js'

import { baseUrl, osmosisImperatorBaseUrl, OsmosisPool } from './constants'

interface PoolHistoricalDataRecord {
  pool_id: string
  volume_24h: number
  volume_7d: number
  fees_spend_24h: number
  fees_spent_7d: number
  fees_percentage: string
}

interface PoolMarketData {
  price: number
  denom: string
  symbol: string
  main: boolean
  liquidity: number
  liquidity_24h_change: number
  volume_24h: number
  volume_24h_change: number
  name: string
  price_24h_change: number
  exponent: number
  display: string
}

export class OsmosisSdk {
  async getPools(): Promise<OsmosisPool[]> {
    try {
      const results = await axios.get(`${baseUrl}gamm/v1beta1/pools?pagination.limit=1000/pools`)
      const historicalData = await axios.get(`${osmosisImperatorBaseUrl}fees/v1/pools`)
      if (results && results.data) {
        return results.data
          .filter((pool: OsmosisPool) => pool.id === '1') // Only support OSMO/ATOM pool for now
          .map(async (pool: OsmosisPool) => {
            pool.apr =
              historicalData && historicalData.data
                ? await this.calculatePoolAPR(pool, historicalData.data)
                : 0
          })
      }
      return []
    } catch (e) {
      console.warn(e)
      throw new Error('OsmosisSdk::getPools: error fetching pool data')
    }
  }

  private async calculatePoolAPR(
    pool: OsmosisPool,
    data: PoolHistoricalDataRecord[],
  ): Promise<number> {
    const record = data.find((x) => {
      x.pool_id = pool.id
    })

    if (!record) return 0

    const osmoPrice = (await this.getOsmoMarketData()).price
    const feesSpent7d = record.fees_spent_7d
    const averageDayFeeRevenue = new BigNumber(feesSpent7d.toPrecision(6))
      .multipliedBy(osmoPrice)
      .dividedBy(7)
    const annualRevenue = averageDayFeeRevenue.multipliedBy(365)
    const poolTVL = new BigNumber(await this.calculatePoolTVL(pool))

    if (poolTVL.eq(0) || annualRevenue.eq(0)) return 0

    return annualRevenue.dividedBy(poolTVL).multipliedBy(100).toNumber()
  }

  private async getOsmoMarketData(): Promise<PoolMarketData> {
    try {
      const { response }: { response: PoolMarketData[] } = await axios.get(
        `${osmosisImperatorBaseUrl}tokens/v2/OSMO`,
      )

      const data = response[0]

      if (!data) throw new Error('Unable to fetch market data')
      return data
    } catch (e) {
      console.warn(e)
      throw new Error('OsmosisSdk::getPoolMarketData: error fetching market data')
    }
  }

  private async calculatePoolTVL(pool: OsmosisPool): Promise<number> {
    const marketData = await this.getPoolMarketData(pool)

    if (marketData.length !== 2) throw new Error('Two pool assets must be provided.')

    const token1 = marketData[0]
    const token2 = marketData[1]

    const token1Liquidity = new BigNumber(token1.price).multipliedBy(
      new BigNumber(pool.pool_assets[0].token.amount).dividedBy('1e6'),
    )
    const token2Liquidity = new BigNumber(token2.price).multipliedBy(
      new BigNumber(pool.pool_assets[0].token.amount).dividedBy('1e6'),
    )

    return token1Liquidity.plus(token2Liquidity).toNumber()
  }

  private async getPoolMarketData(pool: OsmosisPool): Promise<PoolMarketData[]> {
    /* TODO: Generalize this; remove hardcoded ATOM/OSMO denominations */
    try {
      if (pool.id !== '1') throw new Error('Unsupported pool ID')
      const { token1Response }: { token1Response: PoolMarketData[] } = await axios.get(
        `${osmosisImperatorBaseUrl}tokens/v2/ATOM`,
      )
      const { token2Response }: { token2Response: PoolMarketData[] } = await axios.get(
        `${osmosisImperatorBaseUrl}tokens/v2/OSMO`,
      )
      const token1Data = token1Response[0]
      const token2Data = token2Response[1]

      if (!(token1Data && token2Data)) throw new Error('Unable to fetch market data')
      return [token1Data, token2Data]
    } catch (e) {
      console.warn(e)
      throw new Error('OsmosisSdk::getPoolMarketData: error fetching market data')
    }
  }
}
