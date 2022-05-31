/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { AssetId } from '@shapeshiftoss/caip'

const assetIdToPoolAssetId = (buyAssetId: AssetId): any => {
  if (buyAssetId === 'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48')
    return 'ETH.USDC-0XA0B86991C6218B36C1D19D4A2E9EB0CE3606EB48'
  else if (buyAssetId === 'eip155:1/slip44:60') return 'ETH.ETH'
  else if (buyAssetId === 'bip122:000000000019d6689c085ae165831e93/slip44:0') return 'BTC.BTC'
  else return ''
}

/**
 * BTC (and likely other utxo coins) can only support up to 80 character memos
 */
const MAX_LENGTH = 80

/**
 * @returns thorchain memo shortened to a max of 80 characters
 */
export const makeMemo = ({
  buyAssetId,
  destinationAddress,
  limit
}: {
  buyAssetId: AssetId
  destinationAddress: string
  limit: string
}): string => {
  const thorId = assetIdToPoolAssetId(buyAssetId)
  const fullMemo = `SWAP:${thorId}:${destinationAddress}:${limit}`
  const fullMemoLength = fullMemo.length
  const thorIdLength = thorId.length
  const maxThorIdLength = MAX_LENGTH - (fullMemoLength - thorIdLength)
  const truncatedThorId = thorId.slice(-maxThorIdLength) // TODO slice this correctly
  const shortenedMemo = `SWAP:${truncatedThorId}:${destinationAddress}:${limit}`
  return shortenedMemo
}
