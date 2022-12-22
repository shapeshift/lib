import { ASSET_REFERENCE, osmosisChainId } from '@shapeshiftoss/caip'
import axios from 'axios'
import { BitSet } from 'bitset'

import { Asset } from '../../service/AssetService'
import { getRenderedIdenticonBase64, IdenticonOptions } from '../../service/GenerateAssetIcon'
import { osmosis } from '../baseAssets'
import { colorMap } from '../colorMap'

type OsmoAsset = {
  description: string
  denom_units: {
    denom: string
    exponent: number
    aliases: string[]
  }[]
  base: string
  name: string
  display: string
  symbol: string
  logo_URIs: {
    png: string
    svg: string
  }
  coingecko_id: string
  ibc?: {
    source_channel: string
    dst_channel: string
    source_denom: string
  }
  pools?: {
    [key: string]: number
  }
}

type OsmosisAssetList = {
  chain_id: string
  assets: OsmoAsset[]
}

export const getAssets = async (): Promise<Asset[]> => {
  const { data: assetData } = await axios.get<OsmosisAssetList>(
    'https://raw.githubusercontent.com/osmosis-labs/assetlists/main/osmosis-1/osmosis-1.assetlist.json',
  )

  const lpAssetsAdded = new BitSet()

  return assetData.assets.reduce<Asset[]>((acc, current) => {
    if (!current) return acc

    const denom = current.denom_units.find((item) => item.denom === current.display)
    const precision = denom?.exponent ?? 6

    const { assetNamespace, assetReference } = (() => {
      if (current.base.startsWith('u') && current.base !== 'uosmo') {
        return { assetNamespace: 'native' as const, assetReference: current.base }
      }

      if (current.base.startsWith('ibc')) {
        return { assetNamespace: 'ibc' as const, assetReference: current.base.split('/')[1] }
      }

      return { assetNamespace: 'slip44' as const, assetReference: ASSET_REFERENCE.Osmosis }
    })()

    // if an asset has an ibc object, it's bridged, so label it as e.g. ATOM on Osmosis
    const getAssetName = (a: OsmoAsset): string => (a.ibc ? `${a.name} on Osmosis` : a.name)

    const assetId = `cosmos:osmosis-1/${assetNamespace}:${assetReference}`

    const assetDatum: Asset = {
      assetId,
      chainId: osmosisChainId,
      symbol: current.symbol,
      name: getAssetName(current),
      precision,
      color: colorMap[assetId] ?? '#FFFFFF',
      icon: current.logo_URIs.png,
      explorer: osmosis.explorer,
      explorerAddressLink: osmosis.explorerAddressLink,
      explorerTxLink: osmosis.explorerTxLink,
    }

    if (!assetDatum.icon) {
      const options: IdenticonOptions = {
        identiconImage: {
          size: 128,
          background: [45, 55, 72, 255],
        },
        identiconText: {
          symbolScale: 7,
          enableShadow: true,
        },
      }
      assetDatum.icon = getRenderedIdenticonBase64(
        assetDatum.assetId,
        assetDatum.symbol.substring(0, 3),
        options,
      )
    }
    acc.push(assetDatum)

    // If liquidity pools are available for asset, generate assets representing LP tokens for each pool available.

    /* Osmosis pool IDs are guaranteed to be unique integers, so we can use a bit vector
       to to look up which pools we've already seen in O(1). A lookup is necessary because the 
       Osmosis asset list contains duplicate entries for each pool, eg. ATOM/OSMO == OSMO/ATOM.
       It's debateable whether this is worth the extra package import, but Array.includes() and
       Array.find() are both of complexity O(N), and this should also be faster than Set.has().
     */
    const lpTokenAlreadyAdded = (poolId: number): boolean => {
      const lpAssetVector = new BitSet()
      lpAssetVector.set(poolId, 1)
      // Check if bit at position 1 << poolId is set
      if (lpAssetsAdded.and(lpAssetVector).equals(lpAssetVector)) {
        return true
      }
      return false
    }

    const getLPTokenName = (asset1: string, asset2: string): string =>
      `Osmosis ${asset1}/${asset2} LP Token`

    if (current.pools) {
      for (const [pairedToken, poolId] of Object.entries(current.pools)) {
        if (lpTokenAlreadyAdded(poolId)) continue

        const lpAssetDatum: Asset = {
          assetId: `cosmos:osmosis-1/ibc:gamm/pool/${poolId}`,
          chainId: osmosisChainId,
          symbol: `gamm/pool/${poolId}`,
          name: getLPTokenName(current.symbol, pairedToken),
          precision: 6,
          color: osmosis.color,
          icon: osmosis.icon,
          explorer: osmosis.explorer,
          explorerAddressLink: osmosis.explorerAddressLink,
          explorerTxLink: osmosis.explorerTxLink,
        }
        acc.push(lpAssetDatum)
        lpAssetsAdded.set(poolId, 1)
      }
    }

    return acc
  }, [])
}
