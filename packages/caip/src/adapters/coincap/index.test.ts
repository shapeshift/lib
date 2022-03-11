import { WellKnownChain } from '../../caip2/caip2'
import { AssetNamespace, toCAIP19, WellKnownAsset } from '../../caip19/caip19'
import { caip19ToCoinCap, coincapToCAIP19 } from '.'

describe('adapters:coincap', () => {
  describe('coincapToCAIP19', () => {
    it('can get CAIP19 for bitcoin', () => {
      expect(coincapToCAIP19('bitcoin')).toEqual(WellKnownAsset.BTC)
    })

    it('can get CAIP19 id for ethereum', () => {
      expect(coincapToCAIP19('ethereum')).toEqual(WellKnownAsset.ETH)
    })

    it('can get CAIP19 id for FOX', () => {
      const caip19 = toCAIP19({
        chainId: WellKnownChain.EthereumMainnet,
        assetNamespace: AssetNamespace.ERC20,
        assetReference: '0xc770eefad204b5180df6a14ee197d99d808ee52d'
      })
      expect(coincapToCAIP19('fox-token')).toEqual(caip19)
    })
  })

  it('can get CAIP19 for cosmos', () => {
    expect(coincapToCAIP19('cosmos')).toEqual(WellKnownAsset.ATOM)
  })

  it('can get CAIP19 for osmosis', () => {
    expect(coincapToCAIP19('osmosis')).toEqual(WellKnownAsset.OSMO)
  })

  describe('caip19ToCoinCap', () => {
    it('can get coincap id for bitcoin CAIP19', () => {
      expect(caip19ToCoinCap(WellKnownAsset.BTC)).toEqual('bitcoin')
    })

    it('can get coincap id for ethereum CAIP19', () => {
      expect(caip19ToCoinCap(WellKnownAsset.ETH)).toEqual('ethereum')
    })

    it('can get coincap id for FOX', () => {
      const caip19 = toCAIP19({
        chainId: WellKnownChain.EthereumMainnet,
        assetNamespace: AssetNamespace.ERC20,
        assetReference: '0xc770eefad204b5180df6a14ee197d99d808ee52d'
      })
      expect(caip19ToCoinCap(caip19)).toEqual('fox-token')
    })

    it('can get coincap id for cosmos CAIP19', () => {
      expect(caip19ToCoinCap(WellKnownAsset.ATOM)).toEqual('cosmos')
    })

    it('can get coincap id for osmosis CAIP19', () => {
      expect(caip19ToCoinCap(WellKnownAsset.OSMO)).toEqual('osmosis')
    })
  })
})
