import { WellKnownChain } from '../../caip2/caip2'
import { AssetNamespace, toCAIP19, WellKnownAsset } from '../../caip19/caip19'
import { caip19ToCoingecko, coingeckoToCAIP19 } from '.'

describe('adapters:coingecko', () => {
  describe('coingeckoToCAIP19', () => {
    it('can get CAIP19 for bitcoin', () => {
      const caip19 = WellKnownAsset.BTC
      expect(coingeckoToCAIP19('bitcoin')).toEqual(caip19)
    })

    it('can get CAIP19 id for ethereum', () => {
      const caip19 = WellKnownAsset.ETH
      expect(coingeckoToCAIP19('ethereum')).toEqual(caip19)
    })

    it('can get CAIP19 id for FOX', () => {
      const caip19 = toCAIP19({
        chainId: WellKnownChain.EthereumMainnet,
        assetNamespace: AssetNamespace.ERC20,
        assetReference: '0xc770eefad204b5180df6a14ee197d99d808ee52d'
      })
      expect(coingeckoToCAIP19('shapeshift-fox-token')).toEqual(caip19)
    })
  })

  it('can get CAIP19 for cosmos', () => {
    const caip19 = WellKnownAsset.ATOM
    expect(coingeckoToCAIP19('cosmos')).toEqual(caip19)
  })

  it('can get CAIP19 for osmosis', () => {
    const caip19 = WellKnownAsset.OSMO
    expect(coingeckoToCAIP19('osmosis')).toEqual(caip19)
  })

  describe('caip19ToCoingecko', () => {
    it('can get coingecko id for bitcoin CAIP19', () => {
      const caip19 = WellKnownAsset.BTC
      expect(caip19ToCoingecko(caip19)).toEqual('bitcoin')
    })

    it('can get coingecko id for ethereum CAIP19', () => {
      const caip19 = WellKnownAsset.ETH
      expect(caip19ToCoingecko(caip19)).toEqual('ethereum')
    })

    it('can get coingecko id for FOX', () => {
      const caip19 = toCAIP19({
        chainId: WellKnownChain.EthereumMainnet,
        assetNamespace: AssetNamespace.ERC20,
        assetReference: '0xc770eefad204b5180df6a14ee197d99d808ee52d'
      })
      expect(caip19ToCoingecko(caip19)).toEqual('shapeshift-fox-token')
    })

    it('can get coingecko id for cosmos CAIP19', () => {
      const caip19 = WellKnownAsset.ATOM
      expect(caip19ToCoingecko(caip19)).toEqual('cosmos')
    })

    it('can get coingecko id for osmosis CAIP19', () => {
      const caip19 = WellKnownAsset.OSMO
      expect(caip19ToCoingecko(caip19)).toEqual('osmosis')
    })
  })
})
