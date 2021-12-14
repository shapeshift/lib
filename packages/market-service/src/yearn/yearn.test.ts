import { adapters } from '@shapeshiftoss/caip'
import { ChainTypes, HistoryTimeframe } from '@shapeshiftoss/types'
import axios from 'axios'

import { findAll, findByCaip19, findPriceHistoryByCaip19 } from '..'
import { YearnMarketCap } from './yearn-types'

jest.mock('axios')

const mockedAxios = axios as jest.Mocked<typeof axios>

describe('yearn market service', () => {
  describe('getMarketCap', () => {
    const yWETH: YearnMarketCap = {
      inception: 10774489,
      address: '0xe1237aA7f535b0CC33Fd973D66cBf830354D16c7',
      symbol: 'yWETH',
      name: 'WETH',
      display_name: 'ETH',
      icon:
        'https://rawcdn.githack.com/yearn/yearn-assets/3b3d8fd7fa311063f3af618ddc04e8c4a258009f/icons/multichain-tokens/1/0xe1237aA7f535b0CC33Fd973D66cBf830354D16c7/logo-128.png',
      token: {
        name: 'Wrapped Ether',
        symbol: 'WETH',
        address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        decimals: 18,
        display_name: 'ETH',
        icon:
          'https://rawcdn.githack.com/yearn/yearn-assets/3b3d8fd7fa311063f3af618ddc04e8c4a258009f/icons/multichain-tokens/1/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo-128.png'
      },
      tvl: {
        total_assets: 1.3440975607459204e21,
        price: 4346.53360987,
        tvl: 5842165.222726428
      },
      apy: {
        type: 'v1:simple',
        gross_apr: 0.013240587048120034,
        net_apy: 0.010647678260664595,
        fees: {
          performance: 0.2,
          withdrawal: 0,
          management: null,
          keep_crv: null,
          cvx_keep_crv: null
        },
        points: {
          week_ago: 0,
          month_ago: 0,
          inception: 0.010647678260664595
        },
        composite: null
      }
    }

    const yYFI: YearnMarketCap = {
      inception: 10690968,
      address: '0xBA2E7Fed597fd0E3e70f5130BcDbbFE06bB94fe1',
      symbol: 'yYFI',
      name: 'YFI',
      display_name: 'YFI',
      icon:
        'https://rawcdn.githack.com/yearn/yearn-assets/3b3d8fd7fa311063f3af618ddc04e8c4a258009f/icons/multichain-tokens/1/0xBA2E7Fed597fd0E3e70f5130BcDbbFE06bB94fe1/logo-128.png',
      token: {
        name: 'yearn.finance',
        symbol: 'YFI',
        address: '0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e',
        decimals: 18,
        display_name: 'YFI',
        icon:
          'https://rawcdn.githack.com/yearn/yearn-assets/3b3d8fd7fa311063f3af618ddc04e8c4a258009f/icons/multichain-tokens/1/0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e/logo-128.png'
      },
      tvl: {
        total_assets: 25510491874529993000,
        price: 23528,
        tvl: 600210.8528239417
      },
      apy: {
        type: 'v1:simple',
        gross_apr: 0.011183846540845366,
        net_apy: 0.011245403520755648,
        fees: {
          performance: 0,
          withdrawal: 0,
          management: null,
          keep_crv: null,
          cvx_keep_crv: null
        },
        points: {
          week_ago: 0,
          month_ago: 0,
          inception: 0.011245403520755648
        },
        composite: null
      },
      strategies: [
        {
          address: '0x395F93350D5102B6139Abfc84a7D6ee70488797C',
          name: 'StrategyYFIGovernance'
        }
      ],
      endorsed: true,
      version: '0.1',
      decimals: 18,
      type: 'v1',
      emergency_shutdown: false,
      updated: 1638829836,
      migration: null
    }

    it('can flatten multiple responses', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: [yWETH] }).mockResolvedValue({ data: [yYFI] })
      const result = await findAll()
      expect(Object.keys(result).length).toEqual(2)
    })

    it('can sort by market cap', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: [yWETH] }).mockResolvedValue({ data: [yYFI] })
      const result = await findAll()
      //TODO: fix this
      expect(Object.keys(result)[0]).toEqual(adapters.coingeckoToCAIP19(yYFI.address))
    })

    it('can handle api errors', async () => {
      mockedAxios.get.mockRejectedValue({ error: 'foo' })
      const result = await findAll()
      expect(Object.keys(result).length).toEqual(0)
    })

    it('can handle rate limiting', async () => {
      mockedAxios.get.mockResolvedValue({ status: 429 })
      const result = await findAll()
      expect(Object.keys(result).length).toEqual(0)
    })

    it('can return some results if partially rate limited', async () => {
      mockedAxios.get.mockResolvedValueOnce({ status: 429 }).mockResolvedValue({ data: [eth] })
      const result = await findAll()
      expect(Object.keys(result).length).toEqual(1)
    })

    it('can use default args', async () => {
      mockedAxios.get.mockResolvedValue({ data: [btc] })
      await findAll()
      expect(mockedAxios.get).toHaveBeenCalledTimes(10)
    })

    it('can use override args', async () => {
      mockedAxios.get.mockResolvedValue({ data: [btc] })
      const pages = 1
      const perPage = 10
      await findAll({ pages, perPage })
      expect(mockedAxios.get).toHaveBeenCalledTimes(1)
      const url =
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false'
      expect(mockedAxios.get).toBeCalledWith(url)
    })

    it('can map yearn to caip ids', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: [btc] }).mockResolvedValue({ data: [eth] })
      const result = await findAll()
      const btcCaip19 = adapters.coingeckoToCAIP19('bitcoin')
      const ethCaip19 = adapters.coingeckoToCAIP19('ethereum')
      const [btcKey, ethKey] = Object.keys(result)
      expect(btcKey).toEqual(btcCaip19)
      expect(ethKey).toEqual(ethCaip19)
    })
  })

  describe('getMarketData', () => {
    const args = {
      chain: ChainTypes.Ethereum,
      tokenId: ''
    }

    it('should return market data for ETH', async () => {
      const result = {
        price: 3611.19,
        marketCap: 424970837706,
        changePercent24Hr: 2.19682,
        volume: 21999495657
      }
      const market_data = {
        current_price: {
          usd: result.price
        },
        market_cap: {
          usd: result.marketCap
        },
        price_change_percentage_24h: result.changePercent24Hr,
        total_volume: {
          usd: result.volume
        }
      }
      mockedAxios.get.mockResolvedValue({ data: { market_data } })
      expect(await getMarketData(args)).toEqual(result)
    })

    it('should return null on network error', async () => {
      mockedAxios.get.mockRejectedValue(Error)
      jest.spyOn(console, 'warn').mockImplementation(() => void 0)
      await expect(getMarketData(args)).rejects.toEqual(
        new Error('MarketService(getMarketData): error fetching market data')
      )
    })
  })

  describe('getPriceHistory', () => {
    const args = {
      chain: ChainTypes.Ethereum,
      timeframe: HistoryTimeframe.HOUR
    }

    it('should return market data for ETH', async () => {
      const mockHistoryData = [
        [1631664000000, 47135.43199562694],
        [1631577600000, 45139.83396873267],
        [1631491200000, 46195.21830082935],
        [1631404800000, 45196.488277558245]
      ]

      const expected = [
        { date: new Date('2021-09-15T00:00:00.000Z').valueOf(), price: 47135.43199562694 },
        { date: new Date('2021-09-14T00:00:00.000Z').valueOf(), price: 45139.83396873267 },
        { date: new Date('2021-09-13T00:00:00.000Z').valueOf(), price: 46195.21830082935 },
        { date: new Date('2021-09-12T00:00:00.000Z').valueOf(), price: 45196.488277558245 }
      ]
      mockedAxios.get.mockResolvedValue({ data: { prices: mockHistoryData } })
      expect(await getPriceHistory(args)).toEqual(expected)
    })

    it('should return null on network error', async () => {
      mockedAxios.get.mockRejectedValue(Error)
      jest.spyOn(console, 'warn').mockImplementation(() => void 0)
      await expect(getPriceHistory(args)).rejects.toEqual(
        new Error('MarketService(getPriceHistory): error fetching price history')
      )
    })
  })
})
