import { adapters } from '@shapeshiftoss/caip'
import { Asset } from '@shapeshiftoss/types'
import BigNumber from 'bignumber.js'

import { SwapError, SwapErrorTypes } from '../../../../api'
import { PoolResponse, ThorchainSwapperDeps } from '../../types'
import { fromBaseUnit, toBaseUnit } from '../ethereum/makeTradeTx'
import { thorService } from '../thorService'

const THOR_PRECISION = 8

type PoolData = {
  assetBalance: BigNumber
  runeBalance: BigNumber
}

const getSwapOutput = (inputAmount: BigNumber, poolData: PoolData, toRune: boolean): BigNumber => {
  const x = inputAmount
  const X = toRune ? poolData.assetBalance : poolData.runeBalance
  const Y = toRune ? poolData.runeBalance : poolData.assetBalance
  const numerator = x.times(X).times(Y)
  const denominator = x.plus(X).pow(2)
  return numerator.div(denominator)
}

const getDoubleSwapOutput = (
  input: BigNumber,
  inputPool: PoolData,
  outputPool: PoolData
): BigNumber => {
  const runeToOutput = getSwapOutput(input, inputPool, true)
  return getSwapOutput(runeToOutput, outputPool, false)
}

// https://docs.thorchain.org/how-it-works/prices
// TODO this does not support swaps between native "RUNE"
// Rune swaps use a different calculation because its 1 hop between pools instead of 2
export const getTradeRate = async (
  sellAsset: Asset,
  buyAsset: Asset,
  sellAmount: string,
  deps: ThorchainSwapperDeps
): Promise<string> => {
  const buyPoolId = adapters.assetIdToPoolAssetId({ assetId: buyAsset.assetId })
  const sellPoolId = adapters.assetIdToPoolAssetId({ assetId: sellAsset.assetId })

  if (!buyPoolId || !sellPoolId)
    throw new SwapError(`[getPriceRatio]: No thorchain pool found`, {
      code: SwapErrorTypes.RESPONSE_ERROR,
      details: { buyPoolId, sellPoolId }
    })

  const { data: responseData } = await thorService.get<PoolResponse[]>(`${deps.midgardUrl}/pools`)

  const buyPool = responseData.find((response) => response.asset === buyPoolId)
  const sellPool = responseData.find((response) => response.asset === sellPoolId)

  if (!buyPool || !sellPool)
    throw new SwapError(`[getPriceRatio]: no pools found for`, {
      code: SwapErrorTypes.RESPONSE_ERROR,
      details: { buyPoolId, sellPoolId }
    })

  // All thorchain pool amounts are base 8 regardless of token precision
  const sellBaseAmount = new BigNumber(
    toBaseUnit(fromBaseUnit(sellAmount, sellAsset.precision), THOR_PRECISION)
  )

  const sellAssetPoolData = {
    assetBalance: new BigNumber(sellPool.assetDepth),
    runeBalance: new BigNumber(sellPool.runeDepth)
  }
  const buyAssetPoolData = {
    assetBalance: new BigNumber(buyPool.assetDepth),
    runeBalance: new BigNumber(buyPool.runeDepth)
  }
  const outputAmountBase8 = getDoubleSwapOutput(sellBaseAmount, sellAssetPoolData, buyAssetPoolData)

  const outputAmount = fromBaseUnit(outputAmountBase8, THOR_PRECISION)

  return new BigNumber(outputAmount).div(fromBaseUnit(sellAmount, sellAsset.precision)).toString()
}
