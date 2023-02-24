import 'dotenv/config'

import { avalancheAssetId, CHAIN_REFERENCE, ethAssetId, fromAssetId } from '@shapeshiftoss/caip'
import fs from 'fs'
import merge from 'lodash/merge'
import orderBy from 'lodash/orderBy'

import { Asset, AssetsById } from '../service/AssetService'
import * as avalanche from './avalanche'
import { atom, bitcoin, bitcoincash, dogecoin, litecoin, thorchain } from './baseAssets'
import * as bnbsmartchain from './bnbsmartchain'
import * as ethereum from './ethereum'
import * as optimism from './optimism'
import * as osmosis from './osmosis'
import { overrideAssets } from './overrides'
import { filterOutBlacklistedAssets } from './utils'

const generateAssetData = async () => {
  const ethAssets = await ethereum.getAssets()
  const osmosisAssets = await osmosis.getAssets()
  const avalancheAssets = await avalanche.getAssets()
  const optimismAssets = await optimism.getAssets()
  const bnbsmartchainAssets = await bnbsmartchain.getAssets()

  // all assets, included assets to be blacklisted
  const unfilteredAssetData: Asset[] = [
    bitcoin,
    bitcoincash,
    dogecoin,
    litecoin,
    atom,
    thorchain,
    ...ethAssets,
    ...osmosisAssets,
    ...avalancheAssets,
    ...optimismAssets,
    ...bnbsmartchainAssets,
  ]

  // remove blacklisted assets
  const filteredAssetData = filterOutBlacklistedAssets(unfilteredAssetData)

  // deterministic order so diffs are readable
  const orderedAssetList = orderBy(filteredAssetData, 'assetId')

  const ethAssetNames = ethAssets.map((asset) => asset.name)
  const avalancheAssetNames = avalancheAssets.map((asset) => asset.name)
  const optimismAssetNames = optimismAssets.map((asset) => asset.name)
  const bnbsmartchainAssetNames = bnbsmartchainAssets.map((asset) => asset.name)

  const generatedAssetData = orderedAssetList.reduce<AssetsById>((acc, asset) => {
    const { chainReference } = fromAssetId(asset.assetId)

    // mark any ethereum assets that also exist on other evm chains
    if (
      chainReference === CHAIN_REFERENCE.EthereumMainnet &&
      asset.assetId !== ethAssetId &&
      avalancheAssetNames
        .concat(optimismAssetNames)
        .concat(bnbsmartchainAssetNames)
        .includes(asset.name)
    ) {
      asset.name = `${asset.name} on Ethereum`
    }

    // mark any avalanche assets that also exist on other evm chains
    if (
      chainReference === CHAIN_REFERENCE.AvalancheCChain &&
      asset.assetId !== avalancheAssetId &&
      ethAssetNames.concat(optimismAssetNames).concat(bnbsmartchainAssetNames).includes(asset.name)
    ) {
      asset.name = `${asset.name} on Avalanche`
    }

    // mark any bnbsmartchain assets that also exist on other evm chains
    if (
      chainReference === CHAIN_REFERENCE.BnbSmartChainMainnet &&
      ethAssetNames.concat(optimismAssetNames).concat(avalancheAssetNames).includes(asset.name)
    ) {
      asset.name = `${asset.name} on BNB Smart Chain`
    }

    // mark any optimism assets that also exist on other evm chains
    if (
      chainReference === CHAIN_REFERENCE.OptimismMainnet &&
      ethAssetNames.concat(avalancheAssetNames).concat(bnbsmartchainAssetNames).includes(asset.name)
    ) {
      asset.name = `${asset.name} on Optimism`
    }

    acc[asset.assetId] = asset
    return acc
  }, {})

  // do this last such that manual overrides take priority
  const assetsWithOverridesApplied = Object.entries(overrideAssets).reduce<AssetsById>(
    (prev, [assetId, asset]) => {
      if (prev[assetId]) prev[assetId] = merge(prev[assetId], asset)
      return prev
    },
    generatedAssetData,
  )

  await fs.promises.writeFile(
    `./src/service/generatedAssetData.json`,
    // beautify the file for github diff.
    JSON.stringify(assetsWithOverridesApplied, null, 2),
  )
}

generateAssetData()
  .then(() => {
    console.info('done')
  })
  .catch((err) => console.info(err))
