import {
  CHAIN_NAMESPACE,
  CHAIN_REFERENCE,
  ChainNamespace,
  ChainReference
} from '../chainId/chainId'
import {
  ASSET_REFERENCE,
  AssetNamespace,
  AssetReference,
  chainIdOrUndefined,
  fromAssetId,
  fromCAIP19,
  toAssetId,
  toCAIP19
} from './assetId'

describe('assetId', () => {
  it('should have matching CAIP19 aliases', () => {
    expect(toAssetId).toEqual(toCAIP19)
    expect(fromAssetId).toEqual(fromCAIP19)
  })
  describe('toAssetId', () => {
    describe('toAssetId(fromAssetId())', () => {
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
      ])('returns an AssetId from the result of fromAssetId for %s', (assetId) => {
        expect(toAssetId(fromAssetId(assetId))).toBe(assetId)
      })
    })

    it('can make eth AssetId on mainnet', () => {
      const result = toAssetId({
        chainNamespace: CHAIN_NAMESPACE.Ethereum,
        chainReference: CHAIN_REFERENCE.EthereumMainnet,
        assetNamespace: 'slip44',
        assetReference: ASSET_REFERENCE.Ethereum
      })
      expect(result).toEqual('eip155:1/slip44:60')
    })

    it('can make eth AssetId on ropsten', () => {
      const result = toAssetId({
        chainNamespace: CHAIN_NAMESPACE.Ethereum,
        chainReference: CHAIN_REFERENCE.EthereumRopsten,
        assetNamespace: 'slip44',
        assetReference: ASSET_REFERENCE.Ethereum
      })
      expect(result).toEqual('eip155:3/slip44:60')
    })

    it('throws with invalid eth network', () => {
      expect(() =>
        toAssetId({
          chainNamespace: CHAIN_NAMESPACE.Ethereum,
          chainReference: CHAIN_REFERENCE.CosmosHubVega,
          assetNamespace: 'slip44',
          assetReference: ASSET_REFERENCE.Ethereum
        })
      ).toThrow()
    })

    it('throws with invalid namespace', () => {
      expect(() =>
        toAssetId({
          chainNamespace: CHAIN_NAMESPACE.Ethereum,
          chainReference: CHAIN_REFERENCE.EthereumMainnet,
          assetNamespace: 'cw721',
          assetReference: ASSET_REFERENCE.Ethereum
        })
      ).toThrow()
    })

    it('can make Cosmos AssetId on CosmosHub mainnet', () => {
      const result = toAssetId({
        chainNamespace: CHAIN_NAMESPACE.Cosmos,
        chainReference: CHAIN_REFERENCE.CosmosHubMainnet,
        assetNamespace: 'slip44',
        assetReference: ASSET_REFERENCE.Cosmos
      })
      expect(result).toEqual('cosmos:cosmoshub-4/slip44:118')
    })

    it('can make Cosmos AssetId on CosmosHub mainnet with slip44 reference', () => {
      const result = toAssetId({
        chainNamespace: CHAIN_NAMESPACE.Cosmos,
        chainReference: CHAIN_REFERENCE.CosmosHubMainnet,
        assetNamespace: 'slip44',
        assetReference: ASSET_REFERENCE.Cosmos
      })
      expect(result).toEqual('cosmos:cosmoshub-4/slip44:118')
    })

    it('can make Osmosis AssetId on Osmosis mainnet with slip44 reference', () => {
      const result = toAssetId({
        chainNamespace: CHAIN_NAMESPACE.Cosmos,
        chainReference: CHAIN_REFERENCE.OsmosisMainnet,
        assetNamespace: 'slip44',
        assetReference: ASSET_REFERENCE.Cosmos
      })
      expect(result).toEqual('cosmos:osmosis-1/slip44:118')
    })

    it('can return ibc AssetId for osmosis', () => {
      const chainNamespace = CHAIN_NAMESPACE.Cosmos
      const chainReference = CHAIN_REFERENCE.OsmosisMainnet
      const assetNamespace = 'ibc'
      const assetReference = '346786EA82F41FE55FAD14BF69AD8BA9B36985406E43F3CB23E6C45A285A9593'
      const result = toAssetId({ chainNamespace, chainReference, assetNamespace, assetReference })
      expect(result).toEqual(
        'cosmos:osmosis-1/ibc:346786EA82F41FE55FAD14BF69AD8BA9B36985406E43F3CB23E6C45A285A9593'
      )
    })

    it('can return native AssetId for osmosis', () => {
      const chainNamespace = CHAIN_NAMESPACE.Cosmos
      const chainReference = CHAIN_REFERENCE.OsmosisMainnet
      const assetNamespace = 'native'
      const assetReference = 'uion'
      const result = toAssetId({ chainNamespace, chainReference, assetNamespace, assetReference })
      expect(result).toEqual('cosmos:osmosis-1/native:uion')
    })

    it('can return cw20 AssetId for osmosis', () => {
      const chainNamespace = CHAIN_NAMESPACE.Cosmos
      const chainReference = CHAIN_REFERENCE.OsmosisMainnet
      const assetNamespace = 'cw20'
      const assetReference = 'canlab'
      const result = toAssetId({ chainNamespace, chainReference, assetNamespace, assetReference })
      expect(result).toEqual('cosmos:osmosis-1/cw20:canlab')
    })

    it('can return cw721 AssetId for osmosis', () => {
      const chainNamespace = CHAIN_NAMESPACE.Cosmos
      const chainReference = CHAIN_REFERENCE.OsmosisMainnet
      const assetNamespace = 'cw721'
      const assetReference = 'osmosiskitty'
      const result = toAssetId({ chainNamespace, chainReference, assetNamespace, assetReference })
      expect(result).toEqual('cosmos:osmosis-1/cw721:osmosiskitty')
    })

    it('can make Cosmos AssetId on CosmosHub vega', () => {
      const chainNamespace = CHAIN_NAMESPACE.Cosmos
      const chainReference = CHAIN_REFERENCE.CosmosHubVega
      const result = toAssetId({
        chainNamespace,
        chainReference,
        assetNamespace: 'slip44',
        assetReference: ASSET_REFERENCE.Cosmos
      })
      expect(result).toEqual('cosmos:vega-testnet/slip44:118')
    })

    it('throws with invalid Cosmos network', () => {
      const chainNamespace = CHAIN_NAMESPACE.Cosmos
      const chainReference = CHAIN_REFERENCE.BitcoinTestnet
      expect(() =>
        toAssetId({
          chainNamespace,
          chainReference,
          assetNamespace: 'slip44',
          assetReference: ASSET_REFERENCE.Cosmos
        })
      ).toThrow()
    })

    it('throws with invalid Cosmos slip44 reference', () => {
      const chainNamespace = CHAIN_NAMESPACE.Cosmos
      const chainReference = CHAIN_REFERENCE.OsmosisMainnet
      const assetNamespace = 'slip44'
      expect(() =>
        toAssetId({ chainNamespace, chainReference, assetNamespace, assetReference: 'bad' })
      ).toThrow()
    })

    it('throws with invalid btc network', () => {
      const chainNamespace = CHAIN_NAMESPACE.Bitcoin
      const chainReference = CHAIN_REFERENCE.EthereumRopsten
      expect(() =>
        toAssetId({
          chainNamespace,
          chainReference,
          assetNamespace: 'slip44',
          assetReference: ASSET_REFERENCE.Bitcoin
        })
      ).toThrow()
    })

    it('can make FOX AssetId on mainnet', () => {
      const chainNamespace = CHAIN_NAMESPACE.Ethereum
      const chainReference = CHAIN_REFERENCE.EthereumMainnet
      const assetNamespace = 'erc20'
      const assetReference = '0xc770eefad204b5180df6a14ee197d99d808ee52d'
      const result = toAssetId({ chainNamespace, chainReference, assetNamespace, assetReference })
      expect(result).toEqual('eip155:1/erc20:0xc770eefad204b5180df6a14ee197d99d808ee52d')
    })

    it('should lower case ERC20 asset references', () => {
      const chainNamespace = CHAIN_NAMESPACE.Ethereum
      const chainReference = CHAIN_REFERENCE.EthereumMainnet
      const assetNamespace = 'erc20'
      const assetReference = '0xc770EEfAd204B5180dF6a14Ee197D99d808ee52d'
      const result = toAssetId({ chainNamespace, chainReference, assetNamespace, assetReference })
      expect(result).toEqual('eip155:1/erc20:0xc770eefad204b5180df6a14ee197d99d808ee52d')
    })

    it('should lower case ERC721 asset references', () => {
      const chainNamespace = CHAIN_NAMESPACE.Ethereum
      const chainReference = CHAIN_REFERENCE.EthereumMainnet
      const assetNamespace = 'erc721'
      const assetReference = '0xc770EEfAd204B5180dF6a14Ee197D99d808ee52d'
      const result = toAssetId({ chainNamespace, chainReference, assetNamespace, assetReference })
      expect(result).toEqual('eip155:1/erc721:0xc770eefad204b5180df6a14ee197d99d808ee52d')
    })

    it('can make FOX AssetId on ropsten', () => {
      const chainNamespace = CHAIN_NAMESPACE.Ethereum
      const chainReference = CHAIN_REFERENCE.EthereumRopsten
      const assetNamespace = 'erc20'
      const assetReference = '0xc770eefad204b5180df6a14ee197d99d808ee52d'
      const result = toAssetId({ chainNamespace, chainReference, assetNamespace, assetReference })
      expect(result).toEqual('eip155:3/erc20:0xc770eefad204b5180df6a14ee197d99d808ee52d')
    })

    it('throws with invalid assetReference length', () => {
      const chainNamespace = CHAIN_NAMESPACE.Ethereum
      const chainReference = CHAIN_REFERENCE.EthereumMainnet
      const assetNamespace = 'erc20'
      const assetReference = '0xfoo'
      expect(() =>
        toAssetId({ chainNamespace, chainReference, assetNamespace, assetReference })
      ).toThrow()
    })

    it('throws with no assetReference string', () => {
      const chainNamespace = CHAIN_NAMESPACE.Ethereum
      const chainReference = CHAIN_REFERENCE.EthereumMainnet
      const assetNamespace = 'erc20'
      const assetReference = ''
      expect(() =>
        toAssetId({ chainNamespace, chainReference, assetNamespace, assetReference })
      ).toThrow()
    })

    it('throws with invalid assetReference string', () => {
      const chainNamespace = CHAIN_NAMESPACE.Ethereum
      const chainReference = CHAIN_REFERENCE.EthereumMainnet
      const assetNamespace = 'erc20'
      const assetReference = 'gm'
      expect(() =>
        toAssetId({ chainNamespace, chainReference, assetNamespace, assetReference })
      ).toThrow()
    })

    it('throws if no asset namespace provided', () => {
      const chainNamespace = CHAIN_NAMESPACE.Ethereum
      const chainReference = CHAIN_REFERENCE.EthereumMainnet
      const assetReference = '0xdef1cafe'
      const assetNamespace = '' as AssetNamespace
      expect(() =>
        toAssetId({ chainNamespace, chainReference, assetNamespace, assetReference })
      ).toThrow()
    })

    it('can make bitcoin AssetId on mainnet', () => {
      const chainNamespace = CHAIN_NAMESPACE.Bitcoin
      const chainReference = CHAIN_REFERENCE.BitcoinMainnet
      const result = toAssetId({
        chainNamespace,
        chainReference,
        assetNamespace: 'slip44',
        assetReference: ASSET_REFERENCE.Bitcoin
      })
      expect(result).toEqual('bip122:000000000019d6689c085ae165831e93/slip44:0')
    })

    it('can make bitcoin AssetId on testnet', () => {
      const chainNamespace = CHAIN_NAMESPACE.Bitcoin
      const chainReference = CHAIN_REFERENCE.BitcoinTestnet
      const result = toAssetId({
        chainNamespace,
        chainReference,
        assetNamespace: 'slip44',
        assetReference: ASSET_REFERENCE.Bitcoin
      })
      expect(result).toEqual('bip122:000000000933ea01ad0ee984209779ba/slip44:0')
    })
  })

  describe('fromAssetId', () => {
    describe('fromAssetId(toAssetId())', () => {
      const slip44: AssetNamespace = 'slip44'
      const erc20: AssetNamespace = 'erc20'
      const ibc: AssetNamespace = 'ibc'
      const native: AssetNamespace = 'native'
      it.each([
        [CHAIN_NAMESPACE.Bitcoin, CHAIN_REFERENCE.BitcoinMainnet, slip44, ASSET_REFERENCE.Bitcoin],
        [CHAIN_NAMESPACE.Bitcoin, CHAIN_REFERENCE.BitcoinTestnet, slip44, ASSET_REFERENCE.Bitcoin],
        [
          CHAIN_NAMESPACE.Ethereum,
          CHAIN_REFERENCE.EthereumMainnet,
          slip44,
          ASSET_REFERENCE.Ethereum
        ],
        [
          CHAIN_NAMESPACE.Ethereum,
          CHAIN_REFERENCE.EthereumRopsten,
          slip44,
          ASSET_REFERENCE.Ethereum
        ],
        [
          CHAIN_NAMESPACE.Ethereum,
          CHAIN_REFERENCE.EthereumMainnet,
          erc20,
          '0xc770eefad204b5180df6a14ee197d99d808ee52d'
        ],
        [CHAIN_NAMESPACE.Cosmos, CHAIN_REFERENCE.CosmosHubMainnet, slip44, ASSET_REFERENCE.Cosmos],
        [CHAIN_NAMESPACE.Cosmos, CHAIN_REFERENCE.CosmosHubVega, slip44, ASSET_REFERENCE.Cosmos],
        [CHAIN_NAMESPACE.Cosmos, CHAIN_REFERENCE.OsmosisMainnet, slip44, ASSET_REFERENCE.Osmosis],
        [CHAIN_NAMESPACE.Cosmos, CHAIN_REFERENCE.OsmosisTestnet, slip44, ASSET_REFERENCE.Osmosis],
        [
          CHAIN_NAMESPACE.Cosmos,
          CHAIN_REFERENCE.OsmosisMainnet,
          ibc,
          '346786EA82F41FE55FAD14BF69AD8BA9B36985406E43F3CB23E6C45A285A9593'
        ],
        [CHAIN_NAMESPACE.Cosmos, CHAIN_REFERENCE.OsmosisMainnet, native, 'uion']
      ])(
        'returns a AssetId from the result of fromAssetId for %s',
        (
          chainNamespace: ChainNamespace,
          chainReference: ChainReference,
          assetNamespace: AssetNamespace,
          assetReference: AssetReference | string
        ) => {
          expect(
            fromAssetId(
              toAssetId({ chainNamespace, chainReference, assetNamespace, assetReference })
            )
          ).toStrictEqual({
            chainNamespace,
            chainReference,
            assetReference,
            assetNamespace,
            chainId: chainIdOrUndefined(`${chainNamespace}:${chainReference}`)
          })
        }
      )
    })

    it('can return chain, network from eth AssetId on mainnet', () => {
      const AssetId = 'eip155:1/slip44:60'
      const { chainId, chainReference, chainNamespace, assetNamespace, assetReference } =
        fromAssetId(AssetId)
      expect(chainNamespace).toEqual(CHAIN_NAMESPACE.Ethereum)
      expect(chainReference).toEqual(CHAIN_REFERENCE.EthereumMainnet)
      expect(chainId).toEqual(`${chainNamespace}:${chainReference}`) // FIXME: use toChainId
      expect(assetNamespace).toEqual('slip44')
      expect(assetReference).toEqual(ASSET_REFERENCE.Ethereum)
    })

    it('can return chain, network from eth AssetId on ropsten', () => {
      const AssetId = 'eip155:3/slip44:60'
      const { chainId, chainReference, chainNamespace, assetNamespace, assetReference } =
        fromAssetId(AssetId)
      expect(chainNamespace).toEqual(CHAIN_NAMESPACE.Ethereum)
      expect(chainReference).toEqual(CHAIN_REFERENCE.EthereumRopsten)
      expect(chainId).toEqual(`${chainNamespace}:${chainReference}`) // FIXME: use toChainId
      expect(assetNamespace).toEqual('slip44')
      expect(assetReference).toEqual(ASSET_REFERENCE.Ethereum)
    })

    it('can return chain, network from bitcoin AssetId on mainnet', () => {
      const AssetId = 'bip122:000000000019d6689c085ae165831e93/slip44:0'
      const { chainId, chainReference, chainNamespace, assetNamespace, assetReference } =
        fromAssetId(AssetId)
      expect(chainNamespace).toEqual(CHAIN_NAMESPACE.Bitcoin)
      expect(chainReference).toEqual(CHAIN_REFERENCE.BitcoinMainnet)
      expect(chainId).toEqual(`${chainNamespace}:${chainReference}`) // FIXME: use toChainId
      expect(assetNamespace).toEqual('slip44')
      expect(assetReference).toEqual(ASSET_REFERENCE.Bitcoin)
    })

    it('can return chain, network from bitcoin AssetId on testnet', () => {
      const AssetId = 'bip122:000000000933ea01ad0ee984209779ba/slip44:0'
      const { chainId, chainReference, chainNamespace, assetNamespace, assetReference } =
        fromAssetId(AssetId)
      expect(chainNamespace).toEqual(CHAIN_NAMESPACE.Bitcoin)
      expect(chainReference).toEqual(CHAIN_REFERENCE.BitcoinTestnet)
      expect(chainId).toEqual(`${chainNamespace}:${chainReference}`) // FIXME: use toChainId
      expect(assetNamespace).toEqual('slip44')
      expect(assetReference).toEqual(ASSET_REFERENCE.Bitcoin)
    })

    it('can return chainId, chainReference, chainNamespace, assetNamespace, assetReference from FOX AssetId on mainnet', () => {
      const AssetId = 'eip155:1/erc20:0xc770eefad204b5180df6a14ee197d99d808ee52d'
      const { chainId, chainReference, chainNamespace, assetNamespace, assetReference } =
        fromAssetId(AssetId)
      expect(chainNamespace).toEqual(CHAIN_NAMESPACE.Ethereum)
      expect(chainReference).toEqual(CHAIN_REFERENCE.EthereumMainnet)
      expect(chainId).toEqual(`${chainNamespace}:${chainReference}`) // FIXME: use toChainId
      expect(assetNamespace).toEqual('erc20')
      expect(assetReference).toEqual('0xc770eefad204b5180df6a14ee197d99d808ee52d')
    })

    it('should lower case assetReference for assetNamespace ERC20', () => {
      const AssetId = 'eip155:3/erc20:0xc770EEfAd204B5180dF6a14Ee197D99d808ee52d'
      const { chainId, chainReference, chainNamespace, assetNamespace, assetReference } =
        fromAssetId(AssetId)
      expect(chainNamespace).toEqual(CHAIN_NAMESPACE.Ethereum)
      expect(chainReference).toEqual(CHAIN_REFERENCE.EthereumRopsten)
      expect(chainId).toEqual(`${chainNamespace}:${chainReference}`) // FIXME: use toChainId
      expect(assetNamespace).toEqual('erc20')
      expect(assetReference).toEqual('0xc770eefad204b5180df6a14ee197d99d808ee52d')
    })

    it('should lower case assetReference for assetNamespace ERC721', () => {
      const AssetId = 'eip155:3/erc721:0xc770EEfAd204B5180dF6a14Ee197D99d808ee52d'
      const { chainId, chainReference, chainNamespace, assetNamespace, assetReference } =
        fromAssetId(AssetId)
      expect(chainNamespace).toEqual(CHAIN_NAMESPACE.Ethereum)
      expect(chainReference).toEqual(CHAIN_REFERENCE.EthereumRopsten)
      expect(chainId).toEqual(`${chainNamespace}:${chainReference}`) // FIXME: use toChainId
      expect(assetNamespace).toEqual('erc721')
      expect(assetReference).toEqual('0xc770eefad204b5180df6a14ee197d99d808ee52d')
    })

    it('can return chainId, chainReference, chainNamespace, assetNamespace, assetReference from FOX AssetId on ropsten', () => {
      const AssetId = 'eip155:3/erc20:0xc770eefad204b5180df6a14ee197d99d808ee52d'
      const { chainId, chainReference, chainNamespace, assetNamespace, assetReference } =
        fromAssetId(AssetId)
      expect(chainNamespace).toEqual(CHAIN_NAMESPACE.Ethereum)
      expect(chainReference).toEqual(CHAIN_REFERENCE.EthereumRopsten)
      expect(chainId).toEqual(`${chainNamespace}:${chainReference}`) // FIXME: use toChainId
      expect(assetNamespace).toEqual('erc20')
      expect(assetReference).toEqual('0xc770eefad204b5180df6a14ee197d99d808ee52d')
    })

    it('can parse a cosmoshub native token', () => {
      const AssetId = 'cosmos:cosmoshub-4/slip44:118'
      const { chainId, chainReference, chainNamespace, assetNamespace, assetReference } =
        fromAssetId(AssetId)
      expect(chainNamespace).toEqual(CHAIN_NAMESPACE.Cosmos)
      expect(chainReference).toEqual(CHAIN_REFERENCE.CosmosHubMainnet)
      expect(chainId).toEqual(`${chainNamespace}:${chainReference}`) // FIXME: use toChainId
      expect(assetNamespace).toEqual('slip44')
      expect(assetReference).toEqual(ASSET_REFERENCE.Cosmos)
    })

    it('can parse an osmosis native token', () => {
      const AssetId = 'cosmos:osmosis-1/slip44:118'
      const { chainId, chainReference, chainNamespace, assetNamespace, assetReference } =
        fromAssetId(AssetId)
      expect(chainNamespace).toEqual(CHAIN_NAMESPACE.Cosmos)
      expect(chainReference).toEqual(CHAIN_REFERENCE.OsmosisMainnet)
      expect(chainId).toEqual(`${chainNamespace}:${chainReference}`) // FIXME: use toChainId
      expect(assetNamespace).toEqual('slip44')
      expect(assetReference).toEqual(ASSET_REFERENCE.Osmosis)
    })

    it('can parse an osmosis ibc token', () => {
      const AssetId =
        'cosmos:osmosis-1/ibc:346786EA82F41FE55FAD14BF69AD8BA9B36985406E43F3CB23E6C45A285A9593'
      const { chainId, chainReference, chainNamespace, assetNamespace, assetReference } =
        fromAssetId(AssetId)
      expect(chainNamespace).toEqual(CHAIN_NAMESPACE.Cosmos)
      expect(chainReference).toEqual(CHAIN_REFERENCE.OsmosisMainnet)
      expect(chainId).toEqual(`${chainNamespace}:${chainReference}`) // FIXME: use toChainId
      expect(assetNamespace).toEqual('ibc')
      expect(assetReference).toEqual(
        '346786EA82F41FE55FAD14BF69AD8BA9B36985406E43F3CB23E6C45A285A9593'
      )
    })

    it('can parse an osmosis cw20 token', () => {
      const AssetId = 'cosmos:osmosis-1/cw20:canlab'
      const { chainId, chainReference, chainNamespace, assetNamespace, assetReference } =
        fromAssetId(AssetId)
      expect(chainNamespace).toEqual(CHAIN_NAMESPACE.Cosmos)
      expect(chainReference).toEqual(CHAIN_REFERENCE.OsmosisMainnet)
      expect(chainId).toEqual(`${chainNamespace}:${chainReference}`) // FIXME: use toChainId
      expect(assetNamespace).toEqual('cw20')
      expect(assetReference).toEqual('canlab')
    })

    it('can parse an osmosis cw721 token', () => {
      const AssetId = 'cosmos:osmosis-1/cw721:osmokitty'
      const { chainId, chainReference, chainNamespace, assetNamespace, assetReference } =
        fromAssetId(AssetId)
      expect(chainNamespace).toEqual(CHAIN_NAMESPACE.Cosmos)
      expect(chainReference).toEqual(CHAIN_REFERENCE.OsmosisMainnet)
      expect(chainId).toEqual(`${chainNamespace}:${chainReference}`) // FIXME: use toChainId
      expect(assetNamespace).toEqual('cw721')
      expect(assetReference).toEqual('osmokitty')
    })

    it('errors for an invalid AssetId format', () => {
      expect(() => fromAssetId('invalid')).toThrow()
    })

    it('errors for invalid chaintype', () => {
      expect(() => fromAssetId('invalid:cosmoshub-4/slip44:118')).toThrow()
    })

    it('errors for invalid network type', () => {
      expect(() => fromAssetId('cosmos:invalid/slip44:118')).toThrow()
    })
    it('errors for invalid osmosis asset namespace', () => {
      expect(() => fromAssetId('cosmos:osmosis-1/invalid:118')).toThrow()
    })
  })
})
