import { adapters, AssetId } from '@shapeshiftoss/caip'
import { AssertionError } from 'assert'

import { BN } from '../../utils/bignumber'
import { ThornodePoolResponse } from '../types'
import { getSwapOutput } from '../utils/getTradeRate/getTradeRate'
import { isRune } from '../utils/isRune/isRune'
import { thorService } from '../utils/thorService'

type GetSingleSwapSlippageArgs = {
  inputAmount: BN
  pool: ThornodePoolResponse
  toRune: boolean
}

// Calculate swap slippage
export const getSingleSwapSlippage = ({
  inputAmount,
  pool,
  toRune,
}: GetSingleSwapSlippageArgs): BN => {
  // formula: (inputAmount) / (inputAmount + inputBalance)
  const inputBalance = toRune ? pool.balance_asset : pool.balance_rune // input is asset if toRune
  const denominator = inputAmount.plus(inputBalance)
  return inputAmount.div(denominator)
}

type GetDoubleSwapSlippageArgs = {
  inputAmount: BN
  sellPool: ThornodePoolResponse
  buyPool: ThornodePoolResponse
}

// Calculate swap slippage for double swap
export const getDoubleSwapSlippage = ({
  inputAmount,
  sellPool,
  buyPool,
}: GetDoubleSwapSlippageArgs): BN => {
  // formula: calcSwapSlip1(input1) + calcSwapSlip2(calcSwapOutput1 => input2)
  const firstSwapSlippage = getSingleSwapSlippage({ inputAmount, pool: sellPool, toRune: true })
  const firstSwapOutput = getSwapOutput(inputAmount, sellPool, true)
  const secondSwapSlippage = getSingleSwapSlippage({
    inputAmount: firstSwapOutput,
    pool: buyPool,
    toRune: false,
  })
  return firstSwapSlippage.plus(secondSwapSlippage)
}

type GetSlippageArgs = {
  inputAmount: BN
  daemonUrl: string
  buyAssetId: AssetId
  sellAssetId: AssetId
}

export const getSlippage = async ({
  inputAmount,
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
      return getSingleSwapSlippage({ inputAmount, pool: sellPool, toRune })
    }
    case fromRune: {
      assertIsDefined(buyPool)
      return getSingleSwapSlippage({ inputAmount, pool: buyPool, toRune })
    }
    default: {
      assertIsDefined(sellPool)
      assertIsDefined(buyPool)
      return getDoubleSwapSlippage({ inputAmount, sellPool, buyPool })
    }
  }
}
