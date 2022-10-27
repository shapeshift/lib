import { Asset } from '@shapeshiftoss/asset-service'
import { fromAssetId } from '@shapeshiftoss/caip'
import { getInboundAddressesForChain } from 'packages/swapper/src/swappers/thorchain/utils/getInboundAddressesForChain'

import { SwapError, SwapErrorTypes } from '../../../../../api'
import { ThorchainSwapperDeps } from '../../../types'
import { getLimit } from '../../getLimit/getLimit'
import { makeSwapMemo } from '../../makeSwapMemo/makeSwapMemo'
import { deposit } from '../routerCalldata'

type GetBtcThorTxInfoArgs = {
  deps: ThorchainSwapperDeps
  sellAsset: Asset
  buyAsset: Asset
  sellAmountCryptoPrecision: string
  slippageTolerance: string
  destinationAddress: string
  buyAssetTradeFeeUsd: string
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
  sellAmountCryptoPrecision,
  slippageTolerance,
  destinationAddress,
  buyAssetTradeFeeUsd,
}) => {
  try {
    const { assetReference, assetNamespace } = fromAssetId(sellAsset.assetId)
    const isErc20Trade = assetNamespace === 'erc20'
    const inboundAddresses = await getInboundAddressesForChain(deps.daemonUrl, 'ETH')
    const { address: vault, router } = inboundAddresses

    if (!vault || !router)
      throw new SwapError(`[getPriceRatio]: router or vault found for ETH`, {
        code: SwapErrorTypes.RESPONSE_ERROR,
        details: { inboundAddresses },
      })

    const limit = await getLimit({
      buyAssetId: buyAsset.assetId,
      destinationAddress,
      sellAmountCryptoPrecision,
      sellAsset,
      slippageTolerance,
      deps,
      buyAssetTradeFeeUsd,
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
      sellAmountCryptoPrecision,
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
