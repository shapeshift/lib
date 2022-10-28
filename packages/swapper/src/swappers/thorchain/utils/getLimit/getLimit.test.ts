import { DEFAULT_SLIPPAGE } from '../../../utils/constants'
import { ETH, FOX, RUNE } from '../../../utils/test-data/assets'
import { ThorchainSwapperDeps } from '../../types'
import { getTradeRate } from '../getTradeRate/getTradeRate'
import { getUsdRate } from '../getUsdRate/getUsdRate'
import { getLimit, GetLimitArgs } from './getLimit'

jest.mock('../getUsdRate/getUsdRate')

jest.mock('../getTradeRate/getTradeRate', () => ({
  getTradeRate: jest.fn().mockReturnValue('0.000078'),
}))

describe('getLimit', () => {
  it('should get limit when buy and sell asset are both EVM-based', async () => {
    // FIXME: work out what these should return once THORChain is back online
    ;(getUsdRate as jest.Mock<unknown>).mockReturnValue(Promise.resolve('0.000078'))
    ;(getTradeRate as jest.Mock<unknown>).mockReturnValue(Promise.resolve(1))
    const getLimitArgs: GetLimitArgs = {
      sellAsset: ETH,
      buyAssetId: FOX.assetId,
      sellAmountCryptoPrecision: '1000000000000000000',
      deps: {} as ThorchainSwapperDeps,
      slippageTolerance: DEFAULT_SLIPPAGE,
      buyAssetTradeFeeUsd: '10',
      destinationAddress: '0xDef1C0ded9bec7F1a1670819833240f027b25EfF',
    }
    const limit = await getLimit(getLimitArgs)
    // FIXME: work out what this should be once THORChain is back online
    expect(limit).toBe('0')
  })

  it('should get limit when buy asset is RUNE and sell asset is not', async () => {
    // FIXME: work out what these should return once THORChain is back online
    ;(getUsdRate as jest.Mock<unknown>).mockReturnValue(Promise.resolve('0.000078'))
    ;(getTradeRate as jest.Mock<unknown>).mockReturnValue(Promise.resolve(1))
    const getLimitArgs: GetLimitArgs = {
      sellAsset: FOX,
      buyAssetId: RUNE.assetId,
      sellAmountCryptoPrecision: '1000000000000000000',
      deps: {} as ThorchainSwapperDeps,
      slippageTolerance: DEFAULT_SLIPPAGE,
      buyAssetTradeFeeUsd: '10',
      destinationAddress: '0xDef1C0ded9bec7F1a1670819833240f027b25EfF',
    }
    const limit = await getLimit(getLimitArgs)
    // FIXME: work out what this should be once THORChain is back online
    expect(limit).toBe('0')
  })

  it('should get limit when sell asset is RUNE and buy asset is not', async () => {
    // FIXME: work out what these should return once THORChain is back online
    ;(getUsdRate as jest.Mock<unknown>).mockReturnValue(Promise.resolve('0.000078'))
    ;(getTradeRate as jest.Mock<unknown>).mockReturnValue(Promise.resolve(1))
    const getLimitArgs: GetLimitArgs = {
      sellAsset: RUNE,
      buyAssetId: FOX.assetId,
      sellAmountCryptoPrecision: '1000000000000000000',
      deps: {} as ThorchainSwapperDeps,
      slippageTolerance: DEFAULT_SLIPPAGE,
      buyAssetTradeFeeUsd: '10',
      destinationAddress: '0xDef1C0ded9bec7F1a1670819833240f027b25EfF',
    }
    const limit = await getLimit(getLimitArgs)
    // FIXME: work out what this should be once THORChain is back online
    expect(limit).toBe('0')
  })
})
