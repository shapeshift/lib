import { Asset } from '@shapeshiftoss/asset-service'

import { SwapError, SwapErrorType } from '../../../../../api'
import type { ThorchainSwapperDeps } from '../../../types'
import { getInboundAddressDataForChain } from '../../getInboundAddressDataForChain'
import { getLimit } from '../../getLimit/getLimit'
import { makeSwapMemo } from '../../makeSwapMemo/makeSwapMemo'

type GetBtcThorTxInfoArgs = {
  deps: ThorchainSwapperDeps
  sellAsset: Asset
  buyAsset: Asset
  sellAmountCryptoBaseUnit: string
  slippageTolerance: string
  destinationAddress: string
  xpub: string
  buyAssetTradeFeeUsd: string
}
type GetBtcThorTxInfoReturn = Promise<{
  opReturnData: string
  vault: string
  pubkey: string
}>
type GetBtcThorTxInfo = (args: GetBtcThorTxInfoArgs) => GetBtcThorTxInfoReturn

export const getThorTxInfo: GetBtcThorTxInfo = async ({
  deps,
  sellAsset,
  buyAsset,
  sellAmountCryptoBaseUnit,
  slippageTolerance,
  destinationAddress,
  xpub,
  buyAssetTradeFeeUsd,
}) => {
  try {
    const inboundAddress = await getInboundAddressDataForChain(deps.daemonUrl, sellAsset.assetId)
    const activeVault = inboundAddress?.address
    const haltedVault = !activeVault
      ? await (async () => {
          // getInboundAddressDataForChain defaults to returning no addresses when pools are halted - refetch, this time including halted pools
          const inboundAddressIncludeHalted = await getInboundAddressDataForChain(
            deps.daemonUrl,
            sellAsset.assetId,
            false,
          )

          return inboundAddressIncludeHalted?.address
        })()
      : null

    if (!(activeVault || haltedVault)) {
      throw new SwapError(`[getThorTxInfo]: vault not found for asset`, {
        code: SwapErrorType.RESPONSE_ERROR,
        details: { inboundAddress, sellAsset },
      })
    }

    const vault = activeVault ?? haltedVault
    const limit = await getLimit({
      buyAssetId: buyAsset.assetId,
      sellAmountCryptoBaseUnit,
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

    return {
      opReturnData: memo,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      vault: vault!,
      pubkey: xpub,
    }
  } catch (e) {
    if (e instanceof SwapError) throw e
    throw new SwapError('[getThorTxInfo]', { cause: e, code: SwapErrorType.TRADE_QUOTE_FAILED })
  }
}
