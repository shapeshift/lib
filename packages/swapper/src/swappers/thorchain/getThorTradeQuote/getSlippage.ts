import { adapters, AssetId } from '@shapeshiftoss/caip'
import { AssertionError } from 'assert'

import { BN } from '../../utils/bignumber'
import { ThornodePoolResponse } from '../types'
import { getSwapOutput } from '../utils/getTradeRate/getTradeRate'
import { isRune } from '../utils/isRune/isRune'
import { thorService } from '../utils/thorService'

type GetSingleSwapSlippageArgs = {
  inputAmountThorPrecision: BN
  pool: ThornodePoolResponse
  toRune: boolean
}

// Calculate swap slippage
export const getSingleSwapSlippage = ({
  inputAmountThorPrecision,
  pool,
  toRune,
}: GetSingleSwapSlippageArgs): BN => {
  // formula: (inputAmount) / (inputAmount + inputBalance)
  const inputBalance = toRune ? pool.balance_asset : pool.balance_rune // input is asset if toRune
  const denominator = inputAmountThorPrecision.plus(inputBalance)
  return inputAmountThorPrecision.div(denominator)
}

type GetDoubleSwapSlippageArgs = {
  inputAmountThorPrecision: BN
  sellPool: ThornodePoolResponse
  buyPool: ThornodePoolResponse
}

// Calculate swap slippage for double swap
export const getDoubleSwapSlippage = ({
  inputAmountThorPrecision,
  sellPool,
  buyPool,
}: GetDoubleSwapSlippageArgs): BN => {
  // formula: calcSwapSlip1(input1) + calcSwapSlip2(calcSwapOutput1 => input2)
  const firstSwapSlippage = getSingleSwapSlippage({
    inputAmountThorPrecision,
    pool: sellPool,
    toRune: true,
  })
  const firstSwapOutput = getSwapOutput(inputAmountThorPrecision, sellPool, true)
  const secondSwapSlippage = getSingleSwapSlippage({
    inputAmountThorPrecision: firstSwapOutput,
    pool: buyPool,
    toRune: false,
  })
  return firstSwapSlippage.plus(secondSwapSlippage)
}

type GetSlippageArgs = {
  inputAmountThorPrecision: BN
  daemonUrl: string
  buyAssetId: AssetId
  sellAssetId: AssetId
}

export const getSlippage = async ({
  inputAmountThorPrecision,
  daemonUrl,
  buyAssetId,
  sellAssetId,
}: GetSlippageArgs): Promise<BN> => {
  const { data: poolData } = await thorService.get<ThornodePoolResponse[]>(
    `${daemonUrl}/lcd/thorchain/pools`,
  )

  const buyPoolId = adapters.assetIdToPoolAssetId({ assetId: buyAssetId })
  const sellPoolId = adapters.assetIdToPoolAssetId({ assetId: sellAssetId })
  const buyPool = buyPoolId ? poolData.find((response) => response.asset === buyPoolId) : null
  const sellPool = sellPoolId ? poolData.find((response) => response.asset === sellPoolId) : null
  const toRune = isRune(buyAssetId)
  const fromRune = isRune(sellAssetId)

  // asserts x is type doesn't work when using arrow functions
  function assertIsDefined<T>(val: T): asserts val is NonNullable<T> {
    if (val === undefined || val === null) {
      throw new AssertionError({ message: `Expected 'val' to be defined, but received ${val}` })
    }
  }

  switch (true) {
    case toRune: {
      assertIsDefined(sellPool)
      return getSingleSwapSlippage({
        inputAmountThorPrecision,
        pool: sellPool,
        toRune,
      })
    }
    case fromRune: {
      assertIsDefined(buyPool)
      return getSingleSwapSlippage({
        inputAmountThorPrecision,
        pool: buyPool,
        toRune,
      })
    }
    default: {
      assertIsDefined(sellPool)
      assertIsDefined(buyPool)
      return getDoubleSwapSlippage({ inputAmountThorPrecision, sellPool, buyPool })
    }
  }
}
