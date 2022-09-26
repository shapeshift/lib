import { Asset } from '@shapeshiftoss/asset-service'
import { fromAssetId } from '@shapeshiftoss/caip'

import { SwapError, SwapErrorTypes } from '../../../../../api'
import { InboundResponse, ThorchainSwapperDeps } from '../../../types'
import { getLimit } from '../../getLimit/getLimit'
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
  tradeFeeBuyAsset: string
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
  tradeFeeBuyAsset,
}) => {
  try {
    const { assetReference, assetNamespace } = fromAssetId(sellAsset.assetId)

    const isErc20Trade = assetNamespace === 'erc20'
    const { data: inboundAddresses } = await thorService.get<InboundResponse[]>(
      `${deps.midgardUrl}/thorchain/inbound_addresses`,
    )

    const ethInboundAddresses = inboundAddresses.find((inbound) => inbound.chain === 'ETH')

    const vault = ethInboundAddresses?.address
    const router = ethInboundAddresses?.router

    if (!vault || !router)
      throw new SwapError(`[getPriceRatio]: router or vault found for ETH`, {
        code: SwapErrorTypes.RESPONSE_ERROR,
        details: { inboundAddresses },
      })

    const limit = await getLimit({
      buyAssetId: buyAsset.assetId,
      destinationAddress,
      sellAmount,
      sellAsset,
      buyAsset,
      slippageTolerance,
      deps,
      tradeFeeBuyAsset,
    })

    const memo = makeSwapMemo({
      buyAssetId: buyAsset.assetId,
      destinationAddress,
      limit,
    })
    const data = await deposit(
      router,
      vault,
      isErc20Trade ? assetReference : '0x0000000000000000000000000000000000000000',
      sellAmount,
      memo,
    )

    return {
      data,
      memo,
      router,
    }
  } catch (e) {
    if (e instanceof SwapError) throw e
    throw new SwapError('[getThorTxInfo]', { cause: e, code: SwapErrorTypes.TRADE_QUOTE_FAILED })
  }
}
