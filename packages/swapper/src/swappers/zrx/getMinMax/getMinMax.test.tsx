import { zrxService } from '../utils/zrxService'
import { getMinMax } from './getMinMax'
import { FOX, WETH, BTC } from '../utils/test-data/assets'
import { getUsdRate } from '../utils/helpers/helpers'
import { MAX_ZRX_TRADE } from '../utils/constants'

const axios = jest.createMockFromModule('axios')
//@ts-ignore
axios.create = jest.fn(() => axios)

jest.mock('../utils/helpers/helpers')
jest.mock('../utils/zrxService')
jest.mock('../getQuote/getQuote', () => ({
  getZrxQuote: jest.fn()
}))

describe('getMinMax', () => {
  it('returns minimum, maximum, and minimumPrice', async () => {
    ;(zrxService.get as jest.Mock<unknown>).mockReturnValue(
      Promise.resolve({ data: { price: '100' } })
    )
    ;(getUsdRate as jest.Mock<unknown>).mockReturnValue(1)
    const minMax = await getMinMax({ sellAsset: FOX, buyAsset: WETH })
    expect(minMax.minimum).toBe('1')
    expect(minMax.maximum).toBe(MAX_ZRX_TRADE)
    expect(minMax.minimumPrice).toBe('100')
  })
  it('fails on non eth asset', async () => {
    ;(zrxService.get as jest.Mock<unknown>).mockReturnValue(
      Promise.resolve({ data: { price: '100' } })
    )
    ;(getUsdRate as jest.Mock<unknown>).mockReturnValue(1)
    await expect(getMinMax({ sellAsset: BTC, buyAsset: WETH })).rejects.toThrow(
      'ZrxError:getMinMax - must be eth assets'
    )
  })
})
