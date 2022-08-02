import { Asset } from '@shapeshiftoss/asset-service'
import { adapters } from '@shapeshiftoss/caip'

import { SwapError, SwapErrorTypes } from '../../../../api'
import { bn, bnOrZero, fromBaseUnit, toBaseUnit } from '../../../utils/bignumber'
import { ThorchainSwapperDeps } from '../../types'
import {
  THORCHAIN_AFFILIATE_BIPS,
  THORCHAIN_AFFILIATE_NAME,
  THORCHAIN_FIXED_PRECISION
} from '../constants'
import { getTradeRate } from '../getTradeRate/getTradeRate'

// BTC (and likely other utxo coins) can only support up to 80 character memos
const MAX_LENGTH = 80

/**
 * @returns thorchain memo shortened to a max of 80 characters as described:
 * https://dev.thorchain.org/thorchain-dev/memos#mechanism-for-transaction-intent
 */
export const makeSwapMemo = async ({
  buyAssetId,
  destinationAddress,
  sellAsset,
  buyAsset,
  sellAmount,
  deps,
  slippageTolerance,
  tradeFee
}: {
  buyAssetId: string
  destinationAddress: string
  sellAsset: Asset
  buyAsset: Asset
  sellAmount: string
  deps: ThorchainSwapperDeps
  slippageTolerance: string
  tradeFee: string
}): Promise<string> => {
  const tradeRate = await getTradeRate(sellAsset, buyAsset.assetId, sellAmount, deps)
  const expectedBuyAmountPrecision8 = toBaseUnit(
    fromBaseUnit(bnOrZero(sellAmount).times(tradeRate), sellAsset.precision),
    THORCHAIN_FIXED_PRECISION
  )

  const isValidSlippageRange =
    bnOrZero(slippageTolerance).gte(0) && bnOrZero(slippageTolerance).lte(1)
  if (bnOrZero(expectedBuyAmountPrecision8).lt(0) || !isValidSlippageRange)
    throw new SwapError('[getThorTxInfo]: bad expected buy amount or bad slippage tolerance', {
      code: SwapErrorTypes.BUILD_TRADE_FAILED,
      details: { expectedBuyAmountPrecision8, slippageTolerance }
    })

  const tradeFeePrecision8 = toBaseUnit(bnOrZero(tradeFee), THORCHAIN_FIXED_PRECISION)

  const limit = bnOrZero(expectedBuyAmountPrecision8)
    .times(bn(1).minus(slippageTolerance))
    .minus(bnOrZero(tradeFeePrecision8))
    .decimalPlaces(0)
    .toString()

  const thorId = adapters.assetIdToPoolAssetId({ assetId: buyAssetId })
  if (!thorId)
    throw new SwapError('[makeSwapMemo] - undefined thorId for given buyAssetId', {
      code: SwapErrorTypes.MAKE_MEMO_FAILED,
      details: { buyAssetId }
    })

  const memo = `s:${thorId}:${destinationAddress}:${limit}:${THORCHAIN_AFFILIATE_NAME}:${THORCHAIN_AFFILIATE_BIPS}`
  if (memo.length <= MAX_LENGTH) return memo
  const abbreviationAmount = memo.length - MAX_LENGTH

  if (abbreviationAmount > 39)
    throw new SwapError('[makeSwapMemo] - too much abbreviation for accurate matching', {
      code: SwapErrorTypes.MAKE_MEMO_FAILED
    })
  // delimeter between ticker and id allowing us to abbreviate the id: https://dev.thorchain.org/thorchain-dev/memos#asset-notation
  const delimeterIndex = memo.indexOf('-') + 1
  if (!delimeterIndex) {
    throw new SwapError('[makeSwapMemo] - unable to abbreviate asset, no delimeter found', {
      code: SwapErrorTypes.MAKE_MEMO_FAILED
    })
  }
  return memo.replace(memo.slice(delimeterIndex, delimeterIndex + abbreviationAmount), '')
}
