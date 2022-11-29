import { btcAssetId, ethAssetId, thorchainAssetId } from '@shapeshiftoss/caip'

import { bn } from '../../utils/bignumber'
import { getSwapOutput } from '../utils/getTradeRate/getTradeRate'
import {
  btcThornodePool,
  ethThornodePool,
  mockInboundAddresses,
  thornodePools,
} from '../utils/test-data/responses'
import { thorService } from '../utils/thorService'
import { getDoubleSwapSlippage, getSingleSwapSlippage, getSlippage } from './getSlippage'

jest.mock('../utils/thorService')

const mockedAxios = jest.mocked(thorService, true)

describe('getSlippage', () => {
  const expectedBtcRuneSlippage = 0.0010973599869752281
  const expectedRuneEthSlippage = 0.001655144396331673

  beforeEach(() => {
    mockedAxios.get.mockImplementation((url) => {
      switch (url) {
        case '/lcd/thorchain/pools':
          return Promise.resolve({ data: thornodePools })
        case '/lcd/thorchain/inbound_addresses':
          return Promise.resolve({ data: mockInboundAddresses })
        default:
          return Promise.resolve({ data: undefined })
      }
    })
  })

  describe('getSingleSwapSlippage', () => {
    it('should return slippage for BTC -> RUNE single swap', async () => {
      const slippage = await getSingleSwapSlippage({
        inputAmountThorPrecision: bn(100000000), // 1 BTC
        pool: btcThornodePool,
        toRune: true,
      }).toNumber()
      expect(slippage).toEqual(expectedBtcRuneSlippage)
    })

    it('should return slippage for RUNE -> ETH single swap', async () => {
      const firstSwapOutput = getSwapOutput(bn(100000000), btcThornodePool, true)
      const slippage = await getSingleSwapSlippage({
        inputAmountThorPrecision: firstSwapOutput,
        pool: ethThornodePool,
        toRune: false,
      }).toNumber()
      expect(slippage).toEqual(expectedRuneEthSlippage)
    })
  })

  describe('getDoubleSwapSlippage', () => {
    it('should return slippage for BTC -> RUNE -> ETH double swap', async () => {
      const slippage = await getDoubleSwapSlippage({
        inputAmountThorPrecision: bn(100000000), // 1 ETH
        sellPool: btcThornodePool,
        buyPool: ethThornodePool,
      }).toNumber()
      expect(slippage).toEqual(expectedBtcRuneSlippage + expectedRuneEthSlippage)
    })
  })

  describe('getSlippage', () => {
    it('should return slippage for BTC -> RUNE -> ETH double swap', async () => {
      const slippage = await getSlippage({
        inputAmountThorPrecision: bn(100000000), // 1 ETH
        daemonUrl: '',
        buyAssetId: ethAssetId,
        sellAssetId: btcAssetId,
      })
      expect(slippage.toNumber()).toEqual(expectedBtcRuneSlippage + expectedRuneEthSlippage)
    })

    it('should return slippage for RUNE -> ETH single swap', async () => {
      const slippage = await getSlippage({
        inputAmountThorPrecision: bn(100000000), // 1 RUNE
        daemonUrl: '',
        buyAssetId: ethAssetId,
        sellAssetId: thorchainAssetId,
      })
      expect(slippage.toNumber()).toEqual(0.00000016161699588038)
    })

    it('should return slippage for ETH -> RUNE single swap', async () => {
      const slippage = await getSlippage({
        inputAmountThorPrecision: bn(100000000), // 1 ETH
        daemonUrl: '',
        buyAssetId: thorchainAssetId,
        sellAssetId: ethAssetId,
      })
      expect(slippage.toNumber()).toEqual(0.00010927540718746784)
    })
  })
})
