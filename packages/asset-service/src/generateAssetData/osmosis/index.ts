import { ASSET_REFERENCE, osmosisChainId } from '@shapeshiftoss/caip'
import axios from 'axios'
import { BitSet } from 'bitset'

import { Asset } from '../../service/AssetService'
import { getRenderedIdenticonBase64, IdenticonOptions } from '../../service/GenerateAssetIcon'
import { osmosis } from '../baseAssets'
import { colorMap } from '../colorMap'
import { ALLOWABLE_UNDERLYING_ASSET_COUNT } from './constants'

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

type OsmosisLiquidityPool = {
  '@type': string
  address: string
  id: string
  pool_params: {
    swap_fee: string
    exit_fee: string
    smooth_weight_change_params: unknown
  }
  future_pool_governor: string
  total_shares: {
    denom: string
    amount: string
  }
  pool_assets: [
    {
      token: {
        denom: string
        amount: string
      }
      weight: string
    },
    {
      token: {
        denom: string
        amount: string
      }
      weight: string
    },
  ]
  total_weight: string
}

type OsmosisAssetList = {
  chain_id: string
  assets: OsmoAsset[]
}

type OsmosisLiquidityPoolList = {
  pools: OsmosisLiquidityPool[]
  pagination: {
    next_key: string | null
    total: string
  }
}

const generateCaipIdFromAssetName = (
  assetName: string,
): { assetNamespace: string; assetReference: string } => {
  if (assetName.startsWith('u') && assetName !== 'uosmo') {
    return { assetNamespace: 'native' as const, assetReference: assetName }
  }

  if (assetName.startsWith('ibc')) {
    return { assetNamespace: 'ibc' as const, assetReference: assetName.split('/')[1] }
  }

  return { assetNamespace: 'slip44' as const, assetReference: ASSET_REFERENCE.Osmosis }
}

export const getAssets = async (): Promise<Asset[]> => {
  const { data: assetData } = await axios.get<OsmosisAssetList>(
    'https://raw.githubusercontent.com/osmosis-labs/assetlists/main/osmosis-1/osmosis-1.assetlist.json',
  )

  /**
   * Fetch data to populate the underlying assets array for each LP asset in `assets`.
   * We need to make a second request here because the data contained in the symbol generated
   * for each LP asset in the assetData.assets.reduce() call below doesn't guarantee correct Asset0/Asset1 ordering.
   */
  const { data: liquidityPools } = await axios.get<OsmosisLiquidityPoolList>(
    'https://lcd-osmosis.keplr.app/osmosis/gamm/v1beta1/pools?pagination.limit=1000',
  )

  const lpAssetsAdded = new BitSet()

  const assets = assetData.assets.reduce<Asset[]>((acc, current) => {
    if (!current) return acc

    const denom = current.denom_units.find((item) => item.denom === current.display)
    const precision = denom?.exponent ?? 6

    const { assetNamespace, assetReference } = generateCaipIdFromAssetName(current.base)

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

    /* If liquidity pools are available for asset, generate assets representing LP tokens for each pool available. */

    /**
     * Osmosis pool IDs are guaranteed to be unique integers, so we can use a bit vector
     * to look up which pools we've already seen in O(1). A lookup is necessary because the
     * Osmosis asset list contains duplicate entries for each pool, eg. ATOM/OSMO == OSMO/ATOM.
     * It's debatable whether this is worth the extra package import, but Array.includes() and
     * Array.find() are both of complexity O(N), and this should also be faster than Set.has().
     */
    const lpTokenAlreadyAdded = (poolId: number): boolean => {
      const lpAssetVector = new BitSet().set(poolId, 1)
      // Check if bit at position 1 << poolId is set
      if (lpAssetsAdded.and(lpAssetVector).equals(lpAssetVector)) {
        return true
      }
      return false
    }

    const getLPTokenName = (asset0: string, asset1: string): string =>
      `Osmosis ${asset0}/${asset1} LP Token`

    if (current.pools) {
      for (const [pairedToken, poolId] of Object.entries(current.pools)) {
        if (lpTokenAlreadyAdded(poolId)) continue

        const lpAssetDatum: Asset = {
          assetId: `cosmos:osmosis-1/ibc:gamm/pool/${poolId}`,
          chainId: osmosisChainId,
          symbol: `gamm/pool/${poolId}`,
          name: getLPTokenName(current.symbol, pairedToken),
          precision: osmosis.precision,
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

  for (const lpAsset of assets.filter((k) => k.symbol.startsWith('gamm/pool/'))) {
    /* 1.) Get CAIP IDs for both underlying assets */
    const poolId = lpAsset.symbol.split('/')[2] // Osmosis LP token symbols are all of the form `gamm/pool/pool_id`
    /* Get the names of both underlying assets from the Osmosis liquidity pool list */
    const underlyingAssetNames = ((id) => {
      const pool = liquidityPools.pools.find((p) => p.id === id)
      /* Make sure we found a match in the list */
      if (pool === undefined || pool.pool_assets.length !== ALLOWABLE_UNDERLYING_ASSET_COUNT)
        return undefined
      const asset0Name = pool.pool_assets[0].token.denom
      const asset1Name = pool.pool_assets[1].token.denom
      return [asset0Name, asset1Name]
    })(poolId)
    if (underlyingAssetNames === undefined) continue
    /* Generate CAIP IDs from the asset names */
    const { assetNamespace: asset0Namespace, assetReference: asset0Reference } =
      generateCaipIdFromAssetName(underlyingAssetNames[0])
    const { assetNamespace: asset1Namespace, assetReference: asset1Reference } =
      generateCaipIdFromAssetName(underlyingAssetNames[1])
    const asset0Id = `cosmos:osmosis-1/${asset0Namespace}:${asset0Reference}`
    const asset1Id = `cosmos:osmosis-1/${asset1Namespace}:${asset1Reference}`
    lpAsset.underlyingAssets = [asset0Id, asset1Id]
  }

  return assets
}
