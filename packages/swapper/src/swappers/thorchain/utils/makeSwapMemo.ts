import { adapters } from '@shapeshiftoss/caip'

import { SwapError, SwapErrorTypes } from '../../../api'

// BTC (and likely other utxo coins) can only support up to 80 character memos
const MAX_LENGTH = 80

/**
 * @returns thorchain memo shortened to a max of 80 characters as described:
 * https://dev.thorchain.org/thorchain-dev/memos#mechanism-for-transaction-intent
 */
export const makeSwapMemo = ({
  buyAssetId,
  destinationAddress,
  limit
}: {
  buyAssetId: string
  destinationAddress: string
  limit: string
}): string => {
  const thorId = adapters.assetIdToPoolAssetId({ assetId: buyAssetId })
  if (!thorId)
    throw new SwapError('[makeSwapMemo] - undefined thorId for given buyAssetId', {
      code: SwapErrorTypes.MAKE_MEMO_FAILED,
      details: { buyAssetId }
    })

  const fullMemo = `s:${thorId}:${destinationAddress}:${limit}`

  if (fullMemo.length <= MAX_LENGTH) return fullMemo

  const fullMemoLength = fullMemo.length
  const truncateAmount = fullMemoLength - MAX_LENGTH

  const delimeterIndex = thorId.indexOf('-')

  if (delimeterIndex === -1) {
    throw new SwapError('[makeSwapMemo] - unable to abbreviate asset, no delimeter found', {
      code: SwapErrorTypes.MAKE_MEMO_FAILED
    })
  }

  const thorIdSymbol = thorId.slice(0, delimeterIndex)
  const thorIdReferenceTruncated = thorId.slice(thorId.length - truncateAmount, thorId.length)
  const truncatedThorId = `${thorIdSymbol}-${thorIdReferenceTruncated}`
  const shortenedMemo = `s:${truncatedThorId}:${destinationAddress}:${limit}`
  return shortenedMemo
}
