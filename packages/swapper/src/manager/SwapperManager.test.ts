/* eslint-disable @typescript-eslint/ban-ts-comment */
import Web3 from 'web3'
import { ThorchainSwapper, ZrxSwapper } from '../swappers'
import { SwapperManager } from './SwapperManager'
import { ChainAdapterManager } from '@shapeshiftoss/chain-adapters'
import { swapper } from '@shapeshiftoss/types'

describe('SwapperManager', () => {
  const zrxSwapperDeps = {
    web3: <Web3>{},
    adapterManager: <ChainAdapterManager>{}
  }

  describe('constructor', () => {
    it('should return an instance', () => {
      const manager = new SwapperManager()
      expect(manager).toBeInstanceOf(SwapperManager)
    })
  })

  describe('addSwapper', () => {
    it('should add swapper', () => {
      const manager = new SwapperManager()
      manager.addSwapper(swapper.Type.Thorchain, new ThorchainSwapper())
      expect(manager.getSwapper(swapper.Type.Thorchain)).toBeInstanceOf(ThorchainSwapper)
    })

    it('should be chainable', async () => {
      const manager = new SwapperManager()
      manager
        .addSwapper(swapper.Type.Thorchain, new ThorchainSwapper())
        .addSwapper(swapper.Type.Zrx, new ZrxSwapper(zrxSwapperDeps))
      expect(manager.getSwapper(swapper.Type.Zrx)).toBeInstanceOf(ZrxSwapper)
    })

    it('should throw an error if adding an existing chain', () => {
      const manager = new SwapperManager()
      expect(() => {
        manager
          .addSwapper(swapper.Type.Thorchain, new ThorchainSwapper())
          .addSwapper(swapper.Type.Thorchain, new ZrxSwapper(zrxSwapperDeps))
      }).toThrow('already exists')
    })
  })

  describe('getSwapper', () => {
    it('should return a swapper that has been added', () => {
      const manager = new SwapperManager()
      manager.addSwapper(swapper.Type.Thorchain, new ThorchainSwapper())
      expect(manager.getSwapper(swapper.Type.Thorchain)).toBeInstanceOf(ThorchainSwapper)
    })

    it('should return the correct swapper', () => {
      const manager = new SwapperManager()
      manager
        .addSwapper(swapper.Type.Thorchain, new ThorchainSwapper())
        .addSwapper(swapper.Type.Zrx, new ZrxSwapper(zrxSwapperDeps))

      expect(manager.getSwapper(swapper.Type.Thorchain)).toBeInstanceOf(ThorchainSwapper)
      expect(manager.getSwapper(swapper.Type.Zrx)).toBeInstanceOf(ZrxSwapper)
    })

    it('should throw an error if swapper is not set', () => {
      const manager = new SwapperManager()
      expect(() => manager.getSwapper(swapper.Type.Thorchain)).toThrow(
        "SwapperError:getSwapper - Thorchain doesn't exist"
      )
    })

    it('should throw an error if an invalid Swapper instance is passed', () => {
      const manager = new SwapperManager()
      // @ts-ignore
      expect(() => manager.addSwapper(swapper.Type.Thorchain, {})).toThrow(
        'SwapperError:validateSwapper - invalid swapper instance'
      )
    })
  })

  describe('removeSwapper', () => {
    it('should remove swapper and return this', () => {
      const manager = new SwapperManager()
      manager
        .addSwapper(swapper.Type.Thorchain, new ThorchainSwapper())
        .removeSwapper(swapper.Type.Thorchain)
      expect(() => manager.getSwapper(swapper.Type.Thorchain)).toThrow(
        `SwapperError:getSwapper - ${swapper.Type.Thorchain} doesn't exist`
      )
    })

    it("should throw an error if swapper isn't set", () => {
      const manager = new SwapperManager()
      expect(() => manager.removeSwapper(swapper.Type.Thorchain)).toThrow(
        `SwapperError:removeSwapper - ${swapper.Type.Thorchain} doesn't exist`
      )
    })
  })
})
