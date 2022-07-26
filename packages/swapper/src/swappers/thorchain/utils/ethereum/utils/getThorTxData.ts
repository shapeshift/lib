import { Asset } from '@shapeshiftoss/asset-service'
import { fromAssetId } from '@shapeshiftoss/caip'

import { SwapError, SwapErrorTypes } from '../../../../../api'
import { bn, bnOrZero, fromBaseUnit, toBaseUnit } from '../../../../utils/bignumber'
import { InboundResponse, ThorchainSwapperDeps } from '../../../types'
import { getTradeRate } from '../../../utils/getTradeRate/getTradeRate'
import { makeSwapMemo } from '../../makeSwapMemo/makeSwapMemo'
import { thorService } from '../../thorService'
import { deposit } from '../routerCalldata'

type GetBtcThorTxInfoArgs = {
  deps: ThorchainSwapperDeps
  sellAsset: Asset
  buyAsset: Asset
  sellAmount: string
  slippageTolerance: string
  destinationAddress: string
  tradeFee?: string
}
type GetBtcThorTxInfoReturn = Promise<{
  data: string
  memo: string
  router: string
}>
type GetBtcThorTxInfo = (args: GetBtcThorTxInfoArgs) => GetBtcThorTxInfoReturn

export const getThorTxInfo: GetBtcThorTxInfo = async ({
  deps,
  sellAsset,
  buyAsset,
  sellAmount,
  slippageTolerance,
  destinationAddress,
  tradeFee
}) => {
  try {
    const { assetReference, assetNamespace } = fromAssetId(sellAsset.assetId)

    const isErc20Trade = assetNamespace === 'erc20'
    const { data: inboundAddresses } = await thorService.get<InboundResponse[]>(
      `${deps.midgardUrl}/thorchain/inbound_addresses`
    )

    const ethInboundAddresses = inboundAddresses.find((inbound) => inbound.chain === 'ETH')

    const vault = ethInboundAddresses?.address
    const router = ethInboundAddresses?.router

    if (!vault || !router)
      throw new SwapError(`[getPriceRatio]: router or vault found for ETH`, {
        code: SwapErrorTypes.RESPONSE_ERROR,
        details: { inboundAddresses }
      })

    const tradeRate = await getTradeRate(sellAsset, buyAsset.assetId, sellAmount, deps)

    const expectedBuyAmount = toBaseUnit(
      fromBaseUnit(bnOrZero(sellAmount).times(tradeRate), sellAsset.precision),
      8 // limit values are precision 8 regardless of the chain
    )

    const tradeFeeBase8 = toBaseUnit(
      bnOrZero(tradeFee),
      8 // limit values are precision 8 regardless of the chain
    )

    const isValidSlippageRange =
      bnOrZero(slippageTolerance).gte(0) && bnOrZero(slippageTolerance).lte(1)
    if (bnOrZero(expectedBuyAmount).lt(0) || !isValidSlippageRange)
      throw new SwapError('[makeTradeTx]: bad expected buy amount or bad slippage tolerance', {
        code: SwapErrorTypes.BUILD_TRADE_FAILED,
        details: { expectedBuyAmount, slippageTolerance }
      })

    const limit = bnOrZero(expectedBuyAmount)
      .times(bn(1).minus(slippageTolerance))
      .minus(bnOrZero(tradeFeeBase8))
      .decimalPlaces(0)
      .toString()

    const memo = makeSwapMemo({
      buyAssetId: buyAsset.assetId,
      destinationAddress,
      limit
    })

    const data = await deposit(
      router,
      vault,
      isErc20Trade ? assetReference : '0x0000000000000000000000000000000000000000',
      sellAmount,
      memo
    )

    return {
      data,
      memo,
      router
    }
  } catch (e) {
    if (e instanceof SwapError) throw e
    throw new SwapError('[getThorTxInfo]', { cause: e, code: SwapErrorTypes.TRADE_QUOTE_FAILED })
  }
}
