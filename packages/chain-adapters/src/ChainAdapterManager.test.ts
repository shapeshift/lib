/* eslint-disable @typescript-eslint/ban-ts-comment */
import { ChainTypes } from '@shapeshiftoss/types'

import { ChainAdapterManager, UnchainedUrls } from './ChainAdapterManager'
import * as ethereum from './ethereum'

const getCAM = (opts?: UnchainedUrls) => {
  const defaultAdapters: UnchainedUrls = {
    [ChainTypes.Ethereum]: {
      httpUrl: 'http://localhost',
      wsUrl: '',
      rpcUrl: 'http://localhost'
    }
  }
  return new ChainAdapterManager({ ...defaultAdapters, ...opts })
}

describe('ChainAdapterManager', () => {
  describe('constructor', () => {
    it('should return an instance', () => {
      expect(getCAM()).toBeInstanceOf(ChainAdapterManager)
    })

    it('should throw an error if no unchained URLs', () => {
      // @ts-ignore
      expect(() => new ChainAdapterManager()).toThrow('Blockchain urls required')
    })

    it('should throw an error if no adapter is found', () => {
      // @ts-ignore
      expect(() => getCAM({ ripple: 'x' })).toThrow(
        'ChainAdapterManager: cannot instantiate ripple chain adapter'
      )
    })
  })

  describe('addChain', () => {
    it('should throw an error if chain is not a string', () => {
      const cam = getCAM()
      // @ts-ignore
      expect(() => cam.addChain(123, () => {})).toThrow('Parameter validation error') // eslint-disable-line @typescript-eslint/no-empty-function
    })

    it('should throw an error if factory is not a function', () => {
      const cam = getCAM()
      // @ts-ignore
      expect(() => cam.addChain('ripple', undefined)).toThrow('validation')
    })

    it('should add a network', () => {
      const cam = new ChainAdapterManager({})
      expect(cam.getSupportedAdapters()).toHaveLength(0)
      // @ts-ignore
      cam.addChain(ChainTypes.Ethereum, () => ({}))
      expect(cam.getSupportedAdapters()).toHaveLength(1)
    })
  })

  describe('removeChain', () => {
    it('should throw on invalid chain', () => {
      const cam = getCAM()
      const invalidChain = 'foo'
      // @ts-ignore
      expect(() => cam.removeChain(invalidChain)).toThrow(
        `ChainAdapterManager: invalid chain ${invalidChain}`
      )
    })

    it('should throw on unregistered chain', () => {
      const cam = getCAM()
      const unregisteredChain = ChainTypes.Bitcoin
      expect(() => cam.removeChain(unregisteredChain)).toThrow(
        `ChainAdapterManager: chain ${unregisteredChain} not registered`
      )
    })

    it('should remove ethereum chain adapter', () => {
      const cam = getCAM()
      const chain = ChainTypes.Ethereum
      const oldChains = cam.getSupportedAdapters().map((adapter) => adapter().getType())
      expect(oldChains.includes(chain)).toBeTruthy()
      expect(oldChains.length).toEqual(1)
      cam.removeChain(chain)
      const newChains = cam.getSupportedAdapters().map((adapter) => adapter().getType())
      expect(newChains.includes(chain)).toBeFalsy()
      expect(newChains.length).toEqual(0)
    })
  })

  describe('byChain', () => {
    it('should throw an error if no adapter is available', () => {
      const cam = getCAM()
      // @ts-ignore
      expect(() => cam.byChain('ripple')).toThrow(`Network [ripple] is not supported`) // eslint-disable-line @typescript-eslint/no-empty-function
    })

    it('should get an adapter factory', () => {
      const cam = getCAM()
      const adapter = cam.byChain(ChainTypes.Ethereum)
      const adapter2 = cam.byChain(ChainTypes.Ethereum)
      // @ts-ignore
      expect(adapter).toBeInstanceOf(ethereum.ChainAdapter)
      expect(adapter2).toBe(adapter)
    })
  })

  describe('getSupportedChains', () => {
    it('should return array of keys', () => {
      expect(getCAM().getSupportedChains()).toStrictEqual([ChainTypes.Ethereum])
    })
  })

  describe('getSupportedAdapters', () => {
    it('should return array of adapter classes', () => {
      expect(getCAM().getSupportedAdapters()).toStrictEqual([expect.any(Function)])
    })
  })

  describe('byChainId', () => {
    it('should find a supported chain adapter', () => {
      const cam = new ChainAdapterManager({})
      // @ts-ignore
      cam.addChain(ChainTypes.Bitcoin, () => ({
        getChainId: () => 'bip122:000000000019d6689c085ae165831e93'
      }))
      // @ts-ignore
      cam.addChain(ChainTypes.Ethereum, () => ({
        getChainId: () => 'eip155:1'
      }))

      expect(cam.byChainId('eip155:1')).toBeTruthy()
    })

    it('should throw an error for an invalid ChainId', () => {
      const cam = new ChainAdapterManager({})
      expect(() => cam.byChainId('fake:chainId')).toThrow('Chain [fake:chainId] is not supported')
    })

    it('should throw an error if there is no supported adapter', () => {
      const cam = new ChainAdapterManager({})
      expect(() => cam.byChainId('eip155:1')).toThrow('Chain [eip155:1] is not supported')
    })
  })
})
