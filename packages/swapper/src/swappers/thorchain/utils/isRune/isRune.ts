import { AssetId, thorchainAssetId } from '@keepkey/caip'

export const isRune = (assetId: AssetId) => assetId === thorchainAssetId
