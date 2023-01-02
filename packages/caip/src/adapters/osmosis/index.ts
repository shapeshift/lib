import * as adapters from './generated'

export const osmosisGetTokensUrl = 'https://api-osmosis.imperator.co/tokens/v2/all'
export const osmosisGetLpTokensUrl =
  'https://api-osmosis.imperator.co/pools/v2/all?low_liquidity=false'

const generatedAssetIdToOsmosisMap = Object.values(adapters).reduce((acc, cur) => ({
  ...acc,
  ...cur,
})) as Record<string, string>

const invert = <T extends Record<string, string>>(data: T) =>
  Object.entries(data).reduce((acc, [k, v]) => ((acc[v] = k), acc), {} as Record<string, string>)

const generatedOsmosisToAssetIdMap: Record<string, string> = invert(generatedAssetIdToOsmosisMap)

export const osmosisToAssetId = (id: string): string | undefined => generatedOsmosisToAssetIdMap[id]

export const assetIdToOsmosis = (assetId: string): string | undefined =>
  generatedAssetIdToOsmosisMap[assetId]
