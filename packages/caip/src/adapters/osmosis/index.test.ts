import { WellKnownChain } from '../../caip2/caip2'
import { AssetNamespace, toCAIP19, WellKnownAsset } from '../../caip19/caip19'
import { caip19ToOsmosis, osmosisToCAIP19 } from '.'

describe('osmosis adapter', () => {
  describe('osmosisToCAIP19', () => {
    it('can get CAIP19 for non-native asset (Secret Network)', () => {
      const caip19 = toCAIP19({
        chainId: WellKnownChain.OsmosisMainnet,
        assetNamespace: AssetNamespace.IBC,
        assetReference: '0954E1C28EB7AF5B72D24F3BC2B47BBB2FDF91BDDFD57B74B99E133AED40972A'
      })
      expect(osmosisToCAIP19('SCRT')).toEqual(caip19)
    })

    it('can get CAIP19 id for secondary native asset (ion)', () => {
      const caip19 = toCAIP19({
        chainId: WellKnownChain.OsmosisMainnet,
        assetNamespace: AssetNamespace.NATIVE,
        assetReference: 'uion'
      })
      expect(osmosisToCAIP19('ION')).toEqual(caip19)
    })

    it('can get CAIP19 id for native asset (osmo)', () => {
      expect(osmosisToCAIP19('OSMO')).toEqual(WellKnownAsset.OSMO)
    })
  })

  describe('CAIP19toOsmosis', () => {
    it('can get osmosis id for non-native osmosis CAIP19', () => {
      const caip19 = toCAIP19({
        chainId: WellKnownChain.OsmosisMainnet,
        assetNamespace: AssetNamespace.IBC,
        assetReference: '0954E1C28EB7AF5B72D24F3BC2B47BBB2FDF91BDDFD57B74B99E133AED40972A'
      })
      expect(caip19ToOsmosis(caip19)).toEqual('SCRT')
    })

    it('can get osmosis id for secondary native osmosis CAIP19 (ion)', () => {
      const caip19 = toCAIP19({
        chainId: WellKnownChain.OsmosisMainnet,
        assetNamespace: AssetNamespace.NATIVE,
        assetReference: 'uion'
      })
      expect(caip19ToOsmosis(caip19)).toEqual('ION')
    })

    it('can get osmosis id for native osmosis CAIP19 (osmo)', () => {
      expect(caip19ToOsmosis(WellKnownAsset.OSMO)).toEqual('OSMO')
    })
  })
})
