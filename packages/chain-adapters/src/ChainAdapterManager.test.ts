/* eslint-disable @typescript-eslint/ban-ts-comment */
import { WellKnownChain } from '@shapeshiftoss/caip'

import { ChainAdapterManager } from './ChainAdapterManager'
import * as ethereum from './ethereum'

const getCAM = (opts?: Record<string, string>) => {
  // @ts-ignore
  return new ChainAdapterManager({ [WellKnownChain.EthereumMainnet]: 'http://localhost', ...opts })
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
      cam.addChain(WellKnownChain.EthereumMainnet, () => ({}))
      expect(cam.getSupportedAdapters()).toHaveLength(1)
    })
  })

  describe('byChain', () => {
    it('should throw an error if no adapter is available', async () => {
      const cam = getCAM()
      // @ts-ignore
      await expect(() => cam.byChainId('ripple')).rejects.toThrow(
        `Chain ID [ripple] is not supported`
      ) // eslint-disable-line @typescript-eslint/no-empty-function
    })

    it('should get an adapter factory', async () => {
      const cam = getCAM()
      const adapter = await cam.byChainId(WellKnownChain.EthereumMainnet)
      const adapter2 = await cam.byChainId(WellKnownChain.EthereumMainnet)
      // @ts-ignore
      expect(adapter).toBeInstanceOf(ethereum.ChainAdapter)
      expect(adapter2).toBe(adapter)
    })
  })

  describe('getSupportedChains', () => {
    it('should return array of keys', () => {
      expect(getCAM().getSupportedChains()).toStrictEqual([WellKnownChain.EthereumMainnet])
    })
  })

  describe('getSupportedAdapters', () => {
    it('should return array of adapter classes', () => {
      // @ts-ignore
      expect(getCAM().getSupportedAdapters()).toStrictEqual([expect.any(Function)])
    })
  })

  describe('byChainId', () => {
    it('should find a supported chain adapter', async () => {
      const cam = new ChainAdapterManager({})
      // @ts-ignore
      cam.addChain(WellKnownChain.BitcoinMainnet, () => ({
        getCaip2: () => 'bip122:000000000019d6689c085ae165831e93'
      }))
      // @ts-ignore
      cam.addChain(WellKnownChain.EthereumMainnet, () => ({
        getCaip2: () => 'eip155:1'
      }))

      await expect(cam.byChainId('eip155:1')).resolves.toBeTruthy()
    })

    it('should throw an error if there is no supported adapter', async () => {
      const cam = new ChainAdapterManager({})
      await expect(cam.byChainId('fake:caip2')).rejects.toThrow('not supported')
      await expect(cam.byChainId('eip155:1')).rejects.toThrow('not supported')
    })
  })
})
