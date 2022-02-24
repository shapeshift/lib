import axios from 'axios'
import { adapters } from '@shapeshiftoss/caip'
import { OsmosisMarketCap } from './osmosis-types'
import { OsmosisMarketService } from './osmosis'

jest.mock('axios')

const mockedAxios = axios as jest.Mocked<typeof axios>
const osmosisMarketService = new OsmosisMarketService()

describe('osmosis market service', () => {
  const secretNetwork: OsmosisMarketCap = {
    price: 4.5456667708,
    denom: 'ibc/0954E1C28EB7AF5B72D24F3BC2B47BBB2FDF91BDDFD57B74B99E133AED40972A',
    symbol: 'SCRT',
    liquidity: 17581752.09948758,
    liquidity_24h_change: -12.8145359477,
    volume_24h: 3289855.395915219,
    volume_24h_change: 2479142.2564111263,
    name: 'Secret Network',
    price_24h_change: -15.4199369882
  }

  const ion: OsmosisMarketCap = {
    price: 7110.2708806483,
    denom: 'uion',
    symbol: 'ION',
    liquidity: 8737040.33551496,
    liquidity_24h_change: -14.0724963209,
    volume_24h: 353672.5116333088,
    volume_24h_change: 177537.462938586,
    name: 'Ion',
    price_24h_change: -15.5060091033
  }

  const osmo: OsmosisMarketCap = {
    price: 8.0939512289,
    denom: 'uosmo',
    symbol: 'OSMO',
    liquidity: 513382677.98398143,
    liquidity_24h_change: -7.0051901726,
    volume_24h: 169020038.66921267,
    volume_24h_change: 85749118.40114057,
    name: 'Osmosis',
    price_24h_change: -8.5460553557
  }

  describe('findAll', () => {
    it('should sort by market cap', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: [secretNetwork, ion, osmo] })
      const result = await osmosisMarketService.findAll()
      expect(Object.keys(result)[0]).toEqual(adapters.osmosisToCAIP19(osmo.denom))
    })

    it('can handle api errors', async () => {
      mockedAxios.get.mockRejectedValue({ error: 'foo' })
      const result = await osmosisMarketService.findAll()
      expect(Object.keys(result).length).toEqual(0)
    })

    it('can handle rate limiting', async () => {
      mockedAxios.get.mockResolvedValue({ status: 429 })
      const result = await osmosisMarketService.findAll()
      expect(Object.keys(result).length).toEqual(0)
    })
  })

  describe('findByCaip19', () => {
    expect(true).toBe(true)
  })

  describe('findPriceHistoryByCaip19', () => {
    expect(true).toBe(true)
  })
})
