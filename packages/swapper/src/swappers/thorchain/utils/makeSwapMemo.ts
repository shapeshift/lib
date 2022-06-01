import { adapters } from '@shapeshiftoss/caip'

import { SwapError, SwapErrorTypes } from '../../../api'

// BTC (and likely other utxo coins) can only support up to 80 character memos
const MAX_LENGTH = 80

/**
 * @returns thorchain memo shortened to a max of 80 characters as described:
 * https://dev.thorchain.org/thorchain-dev/memos
 */
export const makeSwapMemo = ({
  buyAssetId,
  thorchainSymbol,
  destinationAddress,
  limit
}: {
  buyAssetId: string
  thorchainSymbol: string
  destinationAddress: string
  limit: string
}): string => {
  const thorId = adapters.assetIdToPoolAssetId({
    assetId: buyAssetId,
    symbol: thorchainSymbol
  })
  if (!thorId)
    throw new SwapError('[makeSwapMemo] - undefined thorId', {
      code: SwapErrorTypes.MAKE_MEMO_FAILED
    })

  const fullMemo = `s:${thorId}:${destinationAddress}:${limit}`

  if (fullMemo.length <= MAX_LENGTH) return fullMemo

  const fullMemoLength = fullMemo.length
  const truncateAmount = fullMemoLength - MAX_LENGTH
  const thorIdSymbol = thorId.slice(0, thorId.indexOf('-'))
  const thorIdReferenceTruncated = thorId.slice(thorId.length - truncateAmount, thorId.length)
  const truncatedThorId = `${thorIdSymbol}-${thorIdReferenceTruncated}`
  const shortenedMemo = `s:${truncatedThorId}:${destinationAddress}:${limit}`
  return shortenedMemo
}
