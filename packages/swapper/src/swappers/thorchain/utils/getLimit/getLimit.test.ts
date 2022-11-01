import {
  btcAssetId,
  btcChainId,
  ethAssetId,
  ethChainId,
  thorchainAssetId,
  thorchainChainId,
} from '@shapeshiftoss/caip'
import { ChainAdapterManager } from '@shapeshiftoss/chain-adapters'
import Web3 from 'web3'

import { DEFAULT_SLIPPAGE } from '../../../utils/constants'
import { BTC, ETH, FOX, RUNE } from '../../../utils/test-data/assets'
import { ThorchainSwapperDeps } from '../../types'
import { getTradeRate } from '../getTradeRate/getTradeRate'
import { getUsdRate } from '../getUsdRate/getUsdRate'
import { mockInboundAddresses } from '../test-data/responses'
import { thorService } from '../thorService'
import { getLimit, GetLimitArgs } from './getLimit'

jest.mock('../getUsdRate/getUsdRate')
jest.mock('../thorService')
jest.mock('../getTradeRate/getTradeRate', () => ({
  getTradeRate: jest.fn().mockReturnValue('0.000078'),
}))

const thorchainSwapperDeps: ThorchainSwapperDeps = {
  midgardUrl: '',
  daemonUrl: '',
  adapterManager: new Map([
    [thorchainChainId, { getFeeAssetId: () => thorchainAssetId }],
    [ethChainId, { getFeeAssetId: () => ethAssetId }],
    [btcChainId, { getFeeAssetId: () => btcAssetId }],
  ]) as ChainAdapterManager,
  web3: <Web3>{},
}

describe('getLimit', () => {
  beforeEach(() => {
    ;(thorService.get as jest.Mock<unknown>).mockReturnValue(
      Promise.resolve({ data: mockInboundAddresses }),
    )
  })
  it('should get limit when buy asset is EVM and sell asset is a UTXO', async () => {
    ;(getUsdRate as jest.Mock<unknown>).mockReturnValue(Promise.resolve('20683.172635960644'))
    ;(getTradeRate as jest.Mock<unknown>).mockReturnValue(Promise.resolve('0.07714399680893498205'))
    const getLimitArgs: GetLimitArgs = {
      sellAsset: ETH,
      buyAssetId: BTC.assetId,
      sellAmountCryptoPrecision: '12535000000000000',
      deps: thorchainSwapperDeps,
      slippageTolerance: DEFAULT_SLIPPAGE,
      buyAssetTradeFeeUsd: '6.2049517907881932',
    }
    const limit = await getLimit(getLimitArgs)
    expect(limit).toBe('63799')
  })

  it('should get limit when buy asset is RUNE and sell asset is not', async () => {
    ;(getUsdRate as jest.Mock<unknown>).mockReturnValue(Promise.resolve('1.59114285'))
    ;(getTradeRate as jest.Mock<unknown>).mockReturnValue(Promise.resolve('0.02583433052665346349'))
    const getLimitArgs: GetLimitArgs = {
      sellAsset: FOX,
      buyAssetId: RUNE.assetId,
      sellAmountCryptoPrecision: '484229076000000000000',
      deps: thorchainSwapperDeps,
      slippageTolerance: DEFAULT_SLIPPAGE,
      buyAssetTradeFeeUsd: '0.0318228582',
    }
    const limit = await getLimit(getLimitArgs)
    expect(limit).toBe('1211444101')
  })

  it('should get limit when sell asset is RUNE and buy asset is not', async () => {
    ;(getUsdRate as jest.Mock<unknown>).mockReturnValue(Promise.resolve('0.04136988645923189'))
    ;(getTradeRate as jest.Mock<unknown>).mockReturnValue(
      Promise.resolve('38.68447363336979738738'),
    )
    const getLimitArgs: GetLimitArgs = {
      sellAsset: RUNE,
      buyAssetId: FOX.assetId,
      sellAmountCryptoPrecision: '628381400',
      deps: thorchainSwapperDeps,
      slippageTolerance: DEFAULT_SLIPPAGE,
      buyAssetTradeFeeUsd: '0.0000000026',
    }
    const limit = await getLimit(getLimitArgs)
    expect(limit).toBe('23579345486')
  })
})
