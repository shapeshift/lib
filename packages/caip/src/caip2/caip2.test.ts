import { ChainTypes, NetworkTypes } from '@shapeshiftoss/types'

import { fromCAIP2, toCAIP2 } from './caip2'

describe('caip2', () => {
  describe('toCAIP2', () => {
    it('can turn eth mainnet to caip2', () => {
      const chain = ChainTypes.Ethereum
      const network = NetworkTypes.MAINNET
      const result = toCAIP2({ chain, network })
      expect(result).toEqual('eip155:1')
    })

    it('can turn btc mainnet to caip2', () => {
      const chain = ChainTypes.Bitcoin
      const network = NetworkTypes.MAINNET
      const result = toCAIP2({ chain, network })
      expect(result).toEqual('bip122:000000000019d6689c085ae165831e93')
    })
  })

  describe('fromCAIP2', () => {
    it('can turn btc mainnet to chain and network', () => {
      const btcCaip2 = 'bip122:000000000019d6689c085ae165831e93'
      const { chain, network } = fromCAIP2(btcCaip2)
      expect(chain).toEqual(ChainTypes.Bitcoin)
      expect(network).toEqual(NetworkTypes.MAINNET)
    })

    it('can turn btc testnet to chain and network', () => {
      const btcCaip2 = 'bip122:000000000933ea01ad0ee984209779ba'
      const { chain, network } = fromCAIP2(btcCaip2)
      expect(chain).toEqual(ChainTypes.Bitcoin)
      expect(network).toEqual(NetworkTypes.TESTNET)
    })

    it('can turn eth mainnet to chain and network', () => {
      const ethCaip2 = 'eip155:1'
      const { chain, network } = fromCAIP2(ethCaip2)
      expect(chain).toEqual(ChainTypes.Ethereum)
      expect(network).toEqual(NetworkTypes.MAINNET)
    })

    it('can turn eth ropsten to chain and network', () => {
      const ethCaip2 = 'eip155:3'
      const { chain, network } = fromCAIP2(ethCaip2)
      expect(chain).toEqual(ChainTypes.Ethereum)
      expect(network).toEqual(NetworkTypes.ETH_ROPSTEN)
    })

    it('can turn eth rinkeby to chain and network', () => {
      const ethCaip2 = 'eip155:4'
      const { chain, network } = fromCAIP2(ethCaip2)
      expect(chain).toEqual(ChainTypes.Ethereum)
      expect(network).toEqual(NetworkTypes.ETH_RINKEBY)
    })
  })
})
