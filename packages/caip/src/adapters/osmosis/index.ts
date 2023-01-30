import { osmosisAssetId } from '../../constants'
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

/** TODO (pastaghost): In a separate PR, rename osmosisToAssetId -> OsmosisSymbolToAssedId. Propagate changes across
 * this repository and add alias `export const osmosisToAssetId = osmosisSynbolToAssetId` to preserve
 * backward compatibility until web is updated.
 */
export const osmosisToAssetId = (id: string): string | undefined => generatedOsmosisToAssetIdMap[id]

export const osmosisDenomToAssetId = (denom: string): string | undefined => {
  if (denom === 'uosmo') return osmosisAssetId
  if (denom.includes('gamm/pool')) return generatedOsmosisToAssetIdMap[denom]

  const matches = Object.keys(generatedAssetIdToOsmosisMap).filter((ele) =>
    ele.includes(denom.replace('ibc/', 'ibc:')),
  )
  if (matches.length > 1) return undefined // Table data invalid; keys are not unique

  return matches[0]
}

export const assetIdToOsmosis = (assetId: string): string | undefined =>
  generatedAssetIdToOsmosisMap[assetId]
