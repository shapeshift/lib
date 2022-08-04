import toLower from 'lodash/toLower'

import * as adapters from './generated'

const generatedAssedIdToIdleMap = Object.values(adapters).reduce((acc, cur) => ({
  ...acc,
  ...cur
})) as Record<string, string>

const invert = <T extends Record<string, string>>(data: T) =>
  Object.entries(data).reduce((acc, [k, v]) => ((acc[v] = k), acc), {} as Record<string, string>)

const generatedIdleToAssetIdMap: Record<string, string> = invert(generatedAssedIdToIdleMap)

export const IdleToAssetId = (id: string): string => generatedIdleToAssetIdMap[id]

export const assetIdToIdle = (assetId: string): string | undefined =>
  generatedAssedIdToIdleMap[toLower(assetId)]
