import { AssetId } from './../../assetId/assetId'

import {
    avalancheAssetId,
    btcAssetId,
    ethAssetId,
  } from '../../constants'


const AssetIdToMtPelerinTickerMap = {
    [avalancheAssetId]: 'AVAX',
    [btcAssetId]: 'BTC',
    [ethAssetId]: 'ETH',
} as Record<AssetId, string>

const invert = <T extends Record<string, string>>(data: T) =>
  Object.entries(data).reduce((acc, [k, v]) => ((acc[v] = k), acc), {} as Record<string, string>)

const MtPelerinTickerToAssetIdMap = invert(AssetIdToMtPelerinTickerMap)

export const MtPelerinTickerToAssetId = (ticker: string) => MtPelerinTickerToAssetIdMap[ticker]

export const AssetIdToMtPelerinTicker = (assetId: string) => AssetIdToMtPelerinTickerMap[assetId]