import { ChainTypes, NetworkTypes } from '@shapeshiftoss/types'

import { ASSET_NAMESPACE, ASSET_REFERENCE, toAssetId } from '../../assetId/assetId'
import { assetIdToOsmosis, osmosisToAssetId } from '.'

describe('osmosis adapter', () => {
  describe('osmosisToAssetId', () => {
    it('can get AssetId for non-native asset (Secret Network)', () => {
      const chain = ChainTypes.Osmosis
      const network = NetworkTypes.OSMOSIS_MAINNET
      const assetNamespace = ASSET_NAMESPACE.IBC
      const assetReference = '0954E1C28EB7AF5B72D24F3BC2B47BBB2FDF91BDDFD57B74B99E133AED40972A'
      const assetId = toAssetId({ chain, network, assetNamespace, assetReference })
      expect(osmosisToAssetId('SCRT')).toEqual(assetId)
    })

    it('can get AssetId id for secondary native asset (ion)', () => {
      const chain = ChainTypes.Osmosis
      const network = NetworkTypes.OSMOSIS_MAINNET
      const assetNamespace = ASSET_NAMESPACE.NATIVE
      const assetReference = 'uion'
      const assetId = toAssetId({ chain, network, assetNamespace, assetReference })
      expect(osmosisToAssetId('ION')).toEqual(assetId)
    })

    it('can get AssetId id for native asset (osmo)', () => {
      const chain = ChainTypes.Osmosis
      const network = NetworkTypes.OSMOSIS_MAINNET
      const assetNamespace = ASSET_NAMESPACE.Slip44
      const assetReference = ASSET_REFERENCE.Osmosis.toString()
      const assetId = toAssetId({ chain, network, assetNamespace, assetReference })
      expect(osmosisToAssetId('OSMO')).toEqual(assetId)
    })
  })

  describe('AssetIdtoOsmosis', () => {
    it('can get osmosis id for non-native osmosis AssetId', () => {
      const chain = ChainTypes.Osmosis
      const network = NetworkTypes.OSMOSIS_MAINNET
      const assetNamespace = ASSET_NAMESPACE.IBC
      const assetReference = '0954E1C28EB7AF5B72D24F3BC2B47BBB2FDF91BDDFD57B74B99E133AED40972A'
      const assetId = toAssetId({ chain, network, assetNamespace, assetReference })
      expect(assetIdToOsmosis(assetId)).toEqual('SCRT')
    })

    it('can get osmosis id for secondary native osmosis AssetId (ion)', () => {
      const chain = ChainTypes.Osmosis
      const network = NetworkTypes.OSMOSIS_MAINNET
      const assetNamespace = ASSET_NAMESPACE.NATIVE
      const assetReference = 'uion'
      const assetId = toAssetId({ chain, network, assetNamespace, assetReference })
      expect(assetIdToOsmosis(assetId)).toEqual('ION')
    })

    it('can get osmosis id for native osmosis AssetId (osmo)', () => {
      const chain = ChainTypes.Osmosis
      const network = NetworkTypes.OSMOSIS_MAINNET
      const assetNamespace = ASSET_NAMESPACE.Slip44
      const assetReference = ASSET_REFERENCE.Osmosis.toString()
      const assetId = toAssetId({ chain, network, assetNamespace, assetReference })
      expect(assetIdToOsmosis(assetId)).toEqual('OSMO')
    })
  })
})
