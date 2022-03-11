import { CAIP2, WellKnownChain } from '../caip2/caip2'
import { AssetNamespace, fromCAIP19, toCAIP19, WellKnownAsset } from './caip19'

describe('caip19', () => {
  describe('toCAIP19', () => {
    describe('toCAIP19(fromCAIP19())', () => {
      it.each([
        ['eip155:1/slip44:60'],
        ['eip155:3/slip44:60'],
        ['eip155:1/erc20:0xc770eefad204b5180df6a14ee197d99d808ee52d'],
        ['bip122:000000000019d6689c085ae165831e93/slip44:0'],
        ['bip122:000000000933ea01ad0ee984209779ba/slip44:0'],
        ['cosmos:cosmoshub-4/slip44:118'],
        ['cosmos:vega-testnet/slip44:118'],
        ['cosmos:osmosis-1/slip44:118'],
        ['cosmos:osmosis-1/ibc:346786EA82F41FE55FAD14BF69AD8BA9B36985406E43F3CB23E6C45A285A9593'],
        ['cosmos:osmo-testnet-1/slip44:118']
      ])('returns a caip19 identifier from the result of fromCAIP19 for %s', (assetId) => {
        expect(toCAIP19(fromCAIP19(assetId))).toBe(assetId)
      })
    })

    it('can make eth caip19 identifier on mainnet', () => {
      const result = toCAIP19({
        chainId: WellKnownChain.EthereumMainnet,
        assetNamespace: AssetNamespace.Slip44,
        assetReference: '60'
      })
      expect(result).toEqual('eip155:1/slip44:60')
      expect(result).toEqual(WellKnownAsset.ETH)
    })

    it('can make eth caip19 identifier on ropsten', () => {
      const result = toCAIP19({
        chainId: WellKnownChain.EthereumRopsten,
        assetNamespace: AssetNamespace.Slip44,
        assetReference: '60'
      })
      expect(result).toEqual('eip155:3/slip44:60')
      expect(result).toEqual(WellKnownAsset.ETHRopsten)
    })

    it('throws with invalid eth network', () => {
      expect(() =>
        toCAIP19({
          chainId: 'eip155:4294967295',
          assetNamespace: AssetNamespace.Slip44,
          assetReference: '60'
        })
      ).toThrow()
    })

    it('can make Cosmos caip19 identifier on CosmosHub mainnet with slip44 reference', () => {
      const result = toCAIP19({
        chainId: WellKnownChain.CosmosHubMainnet,
        assetNamespace: AssetNamespace.Slip44,
        assetReference: '118'
      })
      expect(result).toEqual('cosmos:cosmoshub-4/slip44:118')
      expect(result).toEqual(WellKnownAsset.ATOM)
    })

    it('can make Osmosis caip19 identifier on Osmosis mainnet with slip44 reference', () => {
      const result = toCAIP19({
        chainId: WellKnownChain.OsmosisMainnet,
        assetNamespace: AssetNamespace.Slip44,
        assetReference: '118'
      })
      expect(result).toEqual('cosmos:osmosis-1/slip44:118')
      expect(result).toEqual(WellKnownAsset.OSMO)
    })

    it('can return ibc asset caip 19 for osmosis', () => {
      const chainId = WellKnownChain.OsmosisMainnet
      const assetNamespace = AssetNamespace.IBC
      const assetReference = '346786EA82F41FE55FAD14BF69AD8BA9B36985406E43F3CB23E6C45A285A9593'
      const result = toCAIP19({ chainId, assetNamespace, assetReference })
      expect(result).toEqual(
        'cosmos:osmosis-1/ibc:346786EA82F41FE55FAD14BF69AD8BA9B36985406E43F3CB23E6C45A285A9593'
      )
    })

    it('can return native asset caip 19 for osmosis', () => {
      const chainId = WellKnownChain.OsmosisMainnet
      const assetNamespace = AssetNamespace.NATIVE
      const assetReference = 'uion'
      const result = toCAIP19({ chainId, assetNamespace, assetReference })
      expect(result).toEqual('cosmos:osmosis-1/native:uion')
    })

    it('can return cw20 asset caip 19 for osmosis', () => {
      const chainId = WellKnownChain.OsmosisMainnet
      const assetNamespace = AssetNamespace.CW20
      const assetReference = 'canlab'
      const result = toCAIP19({ chainId, assetNamespace, assetReference })
      expect(result).toEqual('cosmos:osmosis-1/cw20:canlab')
    })

    it('can return cw721 asset caip 19 for osmosis', () => {
      const chainId = WellKnownChain.OsmosisMainnet
      const assetNamespace = AssetNamespace.CW721
      const assetReference = 'osmosiskitty'
      const result = toCAIP19({ chainId, assetNamespace, assetReference })
      expect(result).toEqual('cosmos:osmosis-1/cw721:osmosiskitty')
    })

    it('can make Cosmos caip19 identifier on CosmosHub vega', () => {
      const result = toCAIP19({
        chainId: WellKnownChain.CosmosHubVega,
        assetNamespace: AssetNamespace.Slip44,
        assetReference: '118'
      })
      expect(result).toEqual('cosmos:vega-testnet/slip44:118')
      expect(result).toEqual(WellKnownAsset.ATOMVega)
    })

    it('throws with invalid Cosmos slip44 reference', () => {
      const chainId = WellKnownChain.CosmosHubMainnet
      const assetNamespace = AssetNamespace.Slip44
      expect(() => toCAIP19({ chainId, assetNamespace, assetReference: 'bad' })).toThrow()
    })

    it('can make FOX caip19 identifier on mainnet', () => {
      const chainId = WellKnownChain.EthereumMainnet
      const assetNamespace = AssetNamespace.ERC20
      const assetReference = '0xc770eefad204b5180df6a14ee197d99d808ee52d'
      const result = toCAIP19({ chainId, assetNamespace, assetReference })
      expect(result).toEqual('eip155:1/erc20:0xc770eefad204b5180df6a14ee197d99d808ee52d')
    })

    it('should lower case ERC20 asset references', () => {
      const chainId = WellKnownChain.EthereumMainnet
      const assetNamespace = AssetNamespace.ERC20
      const assetReference = '0xc770EEfAd204B5180dF6a14Ee197D99d808ee52d'
      const result = toCAIP19({ chainId, assetNamespace, assetReference })
      expect(result).toEqual('eip155:1/erc20:0xc770eefad204b5180df6a14ee197d99d808ee52d')
    })

    it('should lower case ERC721 asset references', () => {
      const chainId = WellKnownChain.EthereumMainnet
      const assetNamespace = AssetNamespace.ERC721
      const assetReference = '0xc770EEfAd204B5180dF6a14Ee197D99d808ee52d'
      const result = toCAIP19({ chainId, assetNamespace, assetReference })
      expect(result).toEqual('eip155:1/erc721:0xc770eefad204b5180df6a14ee197d99d808ee52d')
    })

    it('can make FOX caip19 identifier on ropsten', () => {
      const chainId = WellKnownChain.EthereumRopsten
      const assetNamespace = AssetNamespace.ERC20
      const assetReference = '0xc770eefad204b5180df6a14ee197d99d808ee52d'
      const result = toCAIP19({ chainId, assetNamespace, assetReference })
      expect(result).toEqual('eip155:3/erc20:0xc770eefad204b5180df6a14ee197d99d808ee52d')
    })

    it('throws with invalid assetReference length', () => {
      const chainId = WellKnownChain.EthereumMainnet
      const assetNamespace = AssetNamespace.ERC20
      const assetReference = '0xfoo'
      expect(() => toCAIP19({ chainId, assetNamespace, assetReference })).toThrow()
    })

    it('throws with no assetReference string', () => {
      const chainId = WellKnownChain.EthereumMainnet
      const assetNamespace = AssetNamespace.ERC20
      const assetReference = ''
      expect(() => toCAIP19({ chainId, assetNamespace, assetReference })).toThrow()
    })

    it('throws with invalid assetReference string', () => {
      const chainId = WellKnownChain.EthereumMainnet
      const assetNamespace = AssetNamespace.ERC20
      const assetReference = 'gm'
      expect(() => toCAIP19({ chainId, assetNamespace, assetReference })).toThrow()
    })

    it('throws if no asset namespace provided', () => {
      const chainId = WellKnownChain.EthereumMainnet
      const assetReference = '0xdef1cafe'
      const assetNamespace = '' as AssetNamespace
      expect(() => toCAIP19({ chainId, assetNamespace, assetReference })).toThrow()
    })

    it('can make bitcoin caip19 on mainnet', () => {
      const result = toCAIP19({
        chainId: WellKnownChain.BitcoinMainnet,
        assetNamespace: AssetNamespace.Slip44,
        assetReference: '0'
      })
      expect(result).toEqual('bip122:000000000019d6689c085ae165831e93/slip44:0')
    })

    it('can make bitcoin caip19 on testnet', () => {
      const result = toCAIP19({
        chainId: WellKnownChain.BitcoinTestnet,
        assetNamespace: AssetNamespace.Slip44,
        assetReference: '1'
      })
      expect(result).toEqual('bip122:000000000933ea01ad0ee984209779ba/slip44:1')
    })
  })

  describe('fromCAIP19', () => {
    describe('fromCAIP19(toCAIP19())', () => {
      it.each([
        [WellKnownChain.BitcoinMainnet, AssetNamespace.Slip44, '0'],
        [WellKnownChain.BitcoinTestnet, AssetNamespace.Slip44, '1'],
        [WellKnownChain.EthereumMainnet, AssetNamespace.Slip44, '60'],
        [WellKnownChain.EthereumRopsten, AssetNamespace.Slip44, '60'],
        [
          WellKnownChain.EthereumMainnet,
          AssetNamespace.ERC20,
          '0xc770eefad204b5180df6a14ee197d99d808ee52d'
        ],
        [WellKnownChain.CosmosHubMainnet, AssetNamespace.Slip44, '118'],
        [WellKnownChain.CosmosHubVega, AssetNamespace.Slip44, '118'],
        [WellKnownChain.OsmosisMainnet, AssetNamespace.Slip44, '118'],
        [WellKnownChain.OsmosisTestnet, AssetNamespace.Slip44, '118'],
        [
          WellKnownChain.OsmosisMainnet,
          AssetNamespace.IBC,
          '346786EA82F41FE55FAD14BF69AD8BA9B36985406E43F3CB23E6C45A285A9593'
        ],
        [WellKnownChain.OsmosisMainnet, AssetNamespace.NATIVE, 'uion']
      ])(
        'returns a caip19 identifier from the result of fromCAIP19 for %s',
        (chainId: CAIP2, assetNamespace: AssetNamespace, assetReference: string) => {
          expect(fromCAIP19(toCAIP19({ chainId, assetNamespace, assetReference }))).toStrictEqual({
            chainId,
            assetReference,
            assetNamespace
          })
        }
      )
    })

    it('can return chain, network from eth caip19 on mainnet', () => {
      const caip19 = 'eip155:1/slip44:60'
      const { chainId, assetNamespace, assetReference } = fromCAIP19(caip19)
      expect(chainId).toEqual(WellKnownChain.EthereumMainnet)
      expect(assetNamespace).toEqual(AssetNamespace.Slip44)
      expect(assetReference).toEqual('60')
    })

    it('can return chain, network from eth caip19 on ropsten', () => {
      const caip19 = 'eip155:3/slip44:60'
      const { chainId, assetNamespace, assetReference } = fromCAIP19(caip19)
      expect(chainId).toEqual(WellKnownChain.EthereumRopsten)
      expect(assetNamespace).toEqual(AssetNamespace.Slip44)
      expect(assetReference).toEqual('60')
    })

    it('can return chain, network from bitcoin caip19 on mainnet', () => {
      const caip19 = 'bip122:000000000019d6689c085ae165831e93/slip44:0'
      const { chainId, assetNamespace, assetReference } = fromCAIP19(caip19)
      expect(chainId).toEqual(WellKnownChain.BitcoinMainnet)
      expect(assetNamespace).toEqual(AssetNamespace.Slip44)
      expect(assetReference).toEqual('0')
    })

    it('can return chain, network from bitcoin caip19 on testnet', () => {
      const caip19 = 'bip122:000000000933ea01ad0ee984209779ba/slip44:1'
      const { chainId, assetNamespace, assetReference } = fromCAIP19(caip19)
      expect(chainId).toEqual(WellKnownChain.BitcoinTestnet)
      expect(assetNamespace).toEqual(AssetNamespace.Slip44)
      expect(assetReference).toEqual('1')
    })

    it('can return chain, network, assetNamespace, assetReference from FOX caip19 identifier on mainnet', () => {
      const caip19 = 'eip155:1/erc20:0xc770eefad204b5180df6a14ee197d99d808ee52d'
      const { chainId, assetNamespace, assetReference } = fromCAIP19(caip19)
      expect(chainId).toEqual(WellKnownChain.EthereumMainnet)
      expect(assetNamespace).toEqual(AssetNamespace.ERC20)
      expect(assetReference).toEqual('0xc770eefad204b5180df6a14ee197d99d808ee52d')
    })

    it('should lower case assetReference for assetNamespace ERC20', () => {
      const caip19 = 'eip155:3/erc20:0xc770EEfAd204B5180dF6a14Ee197D99d808ee52d'
      const { chainId, assetNamespace, assetReference } = fromCAIP19(caip19)
      expect(chainId).toEqual(WellKnownChain.EthereumRopsten)
      expect(assetNamespace).toEqual(AssetNamespace.ERC20)
      expect(assetReference).toEqual('0xc770eefad204b5180df6a14ee197d99d808ee52d')
    })

    it('should lower case assetReference for assetNamespace ERC721', () => {
      const caip19 = 'eip155:3/erc721:0xc770EEfAd204B5180dF6a14Ee197D99d808ee52d'
      const { chainId, assetNamespace, assetReference } = fromCAIP19(caip19)
      expect(chainId).toEqual(WellKnownChain.EthereumRopsten)
      expect(assetNamespace).toEqual(AssetNamespace.ERC721)
      expect(assetReference).toEqual('0xc770eefad204b5180df6a14ee197d99d808ee52d')
    })

    it('can return chain, network, assetNamespace, assetReference from FOX caip19 identifier on ropsten', () => {
      const caip19 = 'eip155:3/erc20:0xc770eefad204b5180df6a14ee197d99d808ee52d'
      const { chainId, assetNamespace, assetReference } = fromCAIP19(caip19)
      expect(chainId).toEqual(WellKnownChain.EthereumRopsten)
      expect(assetNamespace).toEqual(AssetNamespace.ERC20)
      expect(assetReference).toEqual('0xc770eefad204b5180df6a14ee197d99d808ee52d')
    })

    it('can parse a cosmoshub native token', () => {
      const caip19 = 'cosmos:cosmoshub-4/slip44:118'
      const { chainId, assetNamespace, assetReference } = fromCAIP19(caip19)
      expect(chainId).toEqual(WellKnownChain.CosmosHubMainnet)
      expect(assetNamespace).toEqual(AssetNamespace.Slip44)
      expect(assetReference).toEqual('118')
    })

    it('can parse an osmosis native token', () => {
      const caip19 = 'cosmos:osmosis-1/slip44:118'
      const { chainId, assetNamespace, assetReference } = fromCAIP19(caip19)
      expect(chainId).toEqual(WellKnownChain.OsmosisMainnet)
      expect(assetNamespace).toEqual(AssetNamespace.Slip44)
      expect(assetReference).toEqual('118')
    })

    it('can parse an osmosis ibc token', () => {
      const caip19 =
        'cosmos:osmosis-1/ibc:346786EA82F41FE55FAD14BF69AD8BA9B36985406E43F3CB23E6C45A285A9593'
      const { chainId, assetNamespace, assetReference } = fromCAIP19(caip19)
      expect(chainId).toEqual(WellKnownChain.OsmosisMainnet)
      expect(assetNamespace).toEqual(AssetNamespace.IBC)
      expect(assetReference).toEqual(
        '346786EA82F41FE55FAD14BF69AD8BA9B36985406E43F3CB23E6C45A285A9593'
      )
    })

    it('can parse an osmosis cw20 token', () => {
      const caip19 = 'cosmos:osmosis-1/cw20:canlab'
      const { chainId, assetNamespace, assetReference } = fromCAIP19(caip19)
      expect(chainId).toEqual(WellKnownChain.OsmosisMainnet)
      expect(assetNamespace).toEqual(AssetNamespace.CW20)
      expect(assetReference).toEqual('canlab')
    })

    it('can parse an osmosis cw721 token', () => {
      const caip19 = 'cosmos:osmosis-1/cw721:osmokitty'
      const { chainId, assetNamespace, assetReference } = fromCAIP19(caip19)
      expect(chainId).toEqual(WellKnownChain.OsmosisMainnet)
      expect(assetNamespace).toEqual(AssetNamespace.CW721)
      expect(assetReference).toEqual('osmokitty')
    })

    it('errors for an invalid caip19 format', () => {
      expect(() => fromCAIP19('invalid')).toThrow()
    })

    it('errors for invalid chain namespace', () => {
      expect(() => fromCAIP19('invalid:cosmoshub-4/slip44:118')).toThrow()
    })

    it('errors for invalid chain reference', () => {
      expect(() => fromCAIP19('cosmos:invalid/slip44:118')).toThrow()
    })
    it('errors for invalid osmosis asset namespace', () => {
      expect(() => fromCAIP19('cosmos:osmosis-1/invalid:118')).toThrow()
    })
  })
})
