import { Asset } from '@shapeshiftoss/asset-service'
import { AssetId } from '@shapeshiftoss/caip'

export enum AssetValueFormat {
  BASE_UNIT = 1,
  PRECISION = 2,
}

export type AssetValueParams = {
  value: string | number
  format: AssetValueFormat
} & (
  | {
      asset: Asset
      assetId?: never
      precision?: never
    }
  | {
      asset?: never
      assetId: AssetId
      precision: number
    }
)

export type SerializedAssetValue = string

export const isAssetValueParams = (
  params: AssetValueParams | SerializedAssetValue
): params is AssetValueParams => {
  const _params = params as AssetValueParams
  if (
    (_params && _params.asset !== undefined) ||
    (_params && _params.assetId !== undefined && _params.precision !== undefined)
  ) {
    return true
  }
  return false
}
