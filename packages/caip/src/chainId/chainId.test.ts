import { CHAIN_NAMESPACE, CHAIN_REFERENCE } from '../constants'
import { isValidChainId } from '../utils'
import { fromCAIP2, fromChainId, toCAIP2, toChainId } from './chainId'

describe('chainId', () => {
  it('should have matching CAIP2 aliases', () => {
    expect(toChainId).toEqual(toCAIP2)
    expect(fromChainId).toEqual(fromCAIP2)
  })
  describe('toChainId', () => {
    it('can turn CosmosHub mainnet to ChainId', () => {
      const chainNamespace = CHAIN_NAMESPACE.Cosmos
      const chainReference = CHAIN_REFERENCE.CosmosHubMainnet
      const result = toChainId({ chainNamespace, chainReference })
      expect(result).toEqual('cosmos:cosmoshub-4')
    })

    it('can turn CosmosHub testnet to ChainId', () => {
      const chainNamespace = CHAIN_NAMESPACE.Cosmos
      const chainReference = CHAIN_REFERENCE.CosmosHubVega
      const result = toChainId({ chainNamespace, chainReference })
      expect(result).toEqual('cosmos:vega-testnet')
    })

    it('can turn Osmosis mainnet to ChainId', () => {
      const chainNamespace = CHAIN_NAMESPACE.Cosmos
      const chainReference = CHAIN_REFERENCE.OsmosisMainnet
      const result = toChainId({ chainNamespace, chainReference })
      expect(result).toEqual('cosmos:osmosis-1')
    })

    it('can turn Osmosis testnet to ChainId', () => {
      const chainNamespace = CHAIN_NAMESPACE.Cosmos
      const chainReference = CHAIN_REFERENCE.OsmosisTestnet
      const result = toChainId({ chainNamespace, chainReference })
      expect(result).toEqual('cosmos:osmo-testnet-1')
    })

    it('can turn Ethereum mainnet to ChainId', () => {
      const chainNamespace = CHAIN_NAMESPACE.Ethereum
      const chainReference = CHAIN_REFERENCE.EthereumMainnet
      const result = toChainId({ chainNamespace, chainReference })
      expect(result).toEqual('eip155:1')
    })

    it('can turn Ethereum testnet to ChainId', () => {
      const chainNamespace = CHAIN_NAMESPACE.Ethereum
      const chainReference = CHAIN_REFERENCE.EthereumRopsten
      const result = toChainId({ chainNamespace, chainReference })
      expect(result).toEqual('eip155:3')
    })

    it('can turn Bitcoin mainnet to ChainId', () => {
      const chainNamespace = CHAIN_NAMESPACE.Bitcoin
      const chainReference = CHAIN_REFERENCE.BitcoinMainnet
      const result = toChainId({ chainNamespace, chainReference })
      expect(result).toEqual('bip122:000000000019d6689c085ae165831e93')
    })

    it('can turn Bitcoin testnet to ChainId', () => {
      const chainNamespace = CHAIN_NAMESPACE.Bitcoin
      const chainReference = CHAIN_REFERENCE.BitcoinTestnet
      const result = toChainId({ chainNamespace, chainReference })
      expect(result).toEqual('bip122:000000000933ea01ad0ee984209779ba')
    })

    it('should throw an error for an invalid chain', () => {
      // @ts-ignore
      expect(() =>
        toChainId({
          chainNamespace: CHAIN_NAMESPACE.Bitcoin,
          chainReference: CHAIN_REFERENCE.CosmosHubVega
        })
      ).toThrow('isChainId: invalid ChainId bip122:vega-testnet')
    })
  })

  describe('fromChainId', () => {
    it('can turn Bitcoin mainnet to chain and network', () => {
      const bitcoinChainId = 'bip122:000000000019d6689c085ae165831e93'
      const { chainNamespace, chainReference } = fromChainId(bitcoinChainId)
      expect(chainNamespace).toEqual(CHAIN_NAMESPACE.Bitcoin)
      expect(chainReference).toEqual(CHAIN_REFERENCE.BitcoinMainnet)
    })

    it('can turn Bitcoin testnet to chain and network', () => {
      const bitcoinChainId = 'bip122:000000000933ea01ad0ee984209779ba'
      const { chainNamespace, chainReference } = fromChainId(bitcoinChainId)
      expect(chainNamespace).toEqual(CHAIN_NAMESPACE.Bitcoin)
      expect(chainReference).toEqual(CHAIN_REFERENCE.BitcoinTestnet)
    })

    it('throws with invalid Bitcoin namespace ChainId', () => {
      const badBitcoinChainId = 'bip999:000000000933ea01ad0ee984209779ba'
      expect(() => fromChainId(badBitcoinChainId)).toThrow(
        'fromChainId: unsupported Chain Namespace: bip999'
      )
    })

    it('throws with invalid Bitcoin reference ChainId', () => {
      const badBitcoinChainId = 'bip122:000000000xxxxxxxxxxxxxxxxxxxxxxx'
      expect(() => fromChainId(badBitcoinChainId)).toThrow(
        'fromChainId: unsupported Chain Reference: 000000000xxxxxxxxxxxxxxxxxxxxxxx'
      )
    })

    it('can turn CosmosHub mainnet to chain and network', () => {
      const cosmosHubChainId = 'cosmos:cosmoshub-4'
      const { chainNamespace, chainReference } = fromChainId(cosmosHubChainId)
      expect(chainNamespace).toEqual(CHAIN_NAMESPACE.Cosmos)
      expect(chainReference).toEqual(CHAIN_REFERENCE.CosmosHubMainnet)
    })

    it('can turn CosmosHub testnet to chain and network', () => {
      const cosmosHubChainId = 'cosmos:vega-testnet'
      const { chainNamespace, chainReference } = fromChainId(cosmosHubChainId)
      expect(chainNamespace).toEqual(CHAIN_NAMESPACE.Cosmos)
      expect(chainReference).toEqual(CHAIN_REFERENCE.CosmosHubVega)
    })

    it('throws with invalid Cosmos namespace ChainId', () => {
      const badCosmosChainId = 'cosmosssssssssss:cosmoshub-4'
      expect(() => fromChainId(badCosmosChainId)).toThrow(
        'fromChainId: unsupported Chain Namespace: cosmosssssssssss'
      )
    })

    it('throws with invalid Cosmos reference ChainId', () => {
      const badCosmosChainId = 'cosmos:kek-testnet'
      expect(() => fromChainId(badCosmosChainId)).toThrow(
        'fromChainId: unsupported Chain Reference: kek-testnet'
      )
    })

    it('can turn Osmosis mainnet to chain and network', () => {
      const osmosisChainId = 'cosmos:osmosis-1'
      const { chainNamespace, chainReference } = fromChainId(osmosisChainId)
      expect(chainNamespace).toEqual(CHAIN_NAMESPACE.Cosmos)
      expect(chainReference).toEqual(CHAIN_REFERENCE.OsmosisMainnet)
    })

    it('can turn Osmosis testnet to chain and network', () => {
      const osmosisChainId = 'cosmos:osmo-testnet-1'
      const { chainNamespace, chainReference } = fromChainId(osmosisChainId)
      expect(chainNamespace).toEqual(CHAIN_NAMESPACE.Cosmos)
      expect(chainReference).toEqual(CHAIN_REFERENCE.OsmosisTestnet)
    })

    it('can turn Ethereum mainnet to chain and network', () => {
      const ethereumChainId = 'eip155:1'
      const { chainNamespace, chainReference } = fromChainId(ethereumChainId)
      expect(chainNamespace).toEqual(CHAIN_NAMESPACE.Ethereum)
      expect(chainReference).toEqual(CHAIN_REFERENCE.EthereumMainnet)
    })

    it('throws with invalid Ethereum namespace ChainId', () => {
      const badEthereumChainId = 'eip123:1'
      expect(() => fromChainId(badEthereumChainId)).toThrow(
        'fromChainId: unsupported Chain Namespace: eip123'
      )
    })

    it('throws with invalid Ethereum reference ChainId', () => {
      const badEthereumChainId = 'eip155:999'
      expect(() => fromChainId(badEthereumChainId)).toThrow(
        'fromChainId: unsupported Chain Reference: 999'
      )
    })

    it('can turn Ethereum ropsten to chain and network', () => {
      const ethereumChainId = 'eip155:3'
      const { chainNamespace, chainReference } = fromChainId(ethereumChainId)
      expect(chainNamespace).toEqual(CHAIN_NAMESPACE.Ethereum)
      expect(chainReference).toEqual(CHAIN_REFERENCE.EthereumRopsten)
    })

    it('can turn Ethereum rinkeby to chain and network', () => {
      const ethereumChainId = 'eip155:4'
      const { chainNamespace, chainReference } = fromChainId(ethereumChainId)
      expect(chainNamespace).toEqual(CHAIN_NAMESPACE.Ethereum)
      expect(chainReference).toEqual(CHAIN_REFERENCE.EthereumRinkeby)
    })

    it('should throw when there is no network reference', () => {
      expect(() => fromChainId('bip122')).toThrow(
        'fromChainId: unsupported Chain Reference: undefined'
      )
      expect(() => fromChainId(':1')).toThrow('fromChainId: unsupported Chain Namespace: ')
      expect(() => fromChainId(':')).toThrow('fromChainId: unsupported Chain Namespace: ')
    })
  })
})

describe('isChainId', () => {
  it('throws on eip155 without a network reference', () => {
    expect(() => isValidChainId('eip155')).toThrow()
  })

  it('validates eip155:1 mainnet as true', () => {
    expect(isValidChainId('eip155:1')).toBe(true)
  })

  it('throws on eip155:2 invalid network reference', () => {
    expect(() => isValidChainId('eip155:2')).toThrow()
  })

  it('validates ethereum testnets as true', () => {
    expect(isValidChainId('eip155:3')).toBe(true)
    expect(isValidChainId('eip155:4')).toBe(true)
  })

  it('validates bip122:000000000019d6689c085ae165831e93 mainnet as true', () => {
    expect(isValidChainId('bip122:000000000019d6689c085ae165831e93')).toBe(true)
  })

  it('validates bip122:000000000933ea01ad0ee984209779ba testnet as true', () => {
    expect(isValidChainId('bip122:000000000933ea01ad0ee984209779ba')).toBe(true)
  })

  it('throws on bip122 with the wrong network reference', () => {
    expect(() => isValidChainId('bip122:1')).toThrow()
  })

  it('throws on bip122', () => {
    // missing network
    expect(() => isValidChainId('bip122')).toThrow()
  })

  it('throws on empty string', () => {
    // missing network
    expect(() => isValidChainId('')).toThrow()
  })

  it('should return true for cosmos', () => {
    expect(isValidChainId('cosmos:cosmoshub-4')).toBe(true)
    expect(isValidChainId('cosmos:vega-testnet')).toBe(true)
  })

  it('should return true for osmosis', () => {
    expect(isValidChainId('cosmos:osmosis-1')).toBe(true)
    expect(isValidChainId('cosmos:osmo-testnet-1')).toBe(true)
  })

  it('should throw for an unknown cosmos chain', () => {
    expect(() => isValidChainId('cosmos:fakechain-1')).toThrow('invalid')
  })
})
