import { ChainTypes, ContractTypes, NetworkTypes } from '@shapeshiftoss/types'
import { AssetReference, AssetNamespace } from '../../caip19/caip19'

import { toCAIP19 } from './../../caip19/caip19'
import { CAIP19ToOsmosis, osmosisToCAIP19 } from '.'

describe('osmosis adapter', () => {
  describe('osmosisToCAIP19', () => {
    it('can get CAIP19 for non-native asset (Secret Network)', () => {
      const chain = ChainTypes.Cosmos
      const network = NetworkTypes.OSMOSIS_MAINNET
      const assetNamespace = AssetNamespace.IBC
      const assetReference = '0954E1C28EB7AF5B72D24F3BC2B47BBB2FDF91BDDFD57B74B99E133AED40972A'
      const caip19 = toCAIP19({ chain, network, assetNamespace, assetReference })
      expect(osmosisToCAIP19('ibc/0954E1C28EB7AF5B72D24F3BC2B47BBB2FDF91BDDFD57B74B99E133AED40972A')).toEqual(caip19)
    })

    it('can get CAIP19 id for secondary native asset (ion)', () => {
      const chain = ChainTypes.Cosmos
      const network = NetworkTypes.OSMOSIS_MAINNET
      const assetNamespace = AssetNamespace.NATIVE
      const assetReference = 'uion'
      const caip19 = toCAIP19({ chain, network, assetNamespace, assetReference })
      expect(osmosisToCAIP19('uion')).toEqual(caip19)
    })

    it('can get CAIP19 id for native asset (osmo)', () => {
      const chain = ChainTypes.Cosmos
      const network = NetworkTypes.OSMOSIS_MAINNET
      const caip19 = toCAIP19({ chain, network })
      expect(osmosisToCAIP19('uosmo')).toEqual(caip19)
    })
  })

  describe('CAIP19toOsmosis', () => {
    it('can get osmosis id for non-native osmosis CAIP19', () => {
      const chain = ChainTypes.Cosmos
      const network = NetworkTypes.OSMOSIS_MAINNET
      const assetNamespace = AssetNamespace.IBC
      const assetReference = '0954E1C28EB7AF5B72D24F3BC2B47BBB2FDF91BDDFD57B74B99E133AED40972A'
      const caip19 = toCAIP19({ chain, network, assetNamespace, assetReference })
      expect(CAIP19ToOsmosis(caip19)).toEqual('ibc/0954E1C28EB7AF5B72D24F3BC2B47BBB2FDF91BDDFD57B74B99E133AED40972A')
    })

    it('can get osmosis id for secondary native osmosis CAIP19 (ion)', () => {
      const chain = ChainTypes.Cosmos
      const network = NetworkTypes.OSMOSIS_MAINNET
      const assetNamespace = AssetNamespace.NATIVE
      const assetReference = 'uion'
      const caip19 = toCAIP19({ chain, network, assetNamespace, assetReference })
      expect(CAIP19ToOsmosis(caip19)).toEqual('uion')
    })

    it('can get osmosis id for native osmosis CAIP19 (osmo)', () => {
      const chain = ChainTypes.Cosmos
      const network = NetworkTypes.OSMOSIS_MAINNET
      const caip19 = toCAIP19({ chain, network })
      expect(CAIP19ToOsmosis(caip19)).toEqual('uosmo')
    })
  })
})
