/* eslint-disable @typescript-eslint/ban-ts-comment */
import { SwapperType } from '../api'
import { ThorchainSwapper, ZrxSwapper } from '../swappers'
import { SwapperManger } from './SwapperManager'

describe('SwapperManager', () => {
  describe('constructor', () => {
    it('should return an instance', () => {
      const manager = new SwapperManger()
      expect(manager).toBeInstanceOf(SwapperManger)
    })
  })

  describe('addSwapper', () => {
    it('should add swapper', () => {
      const manager = new SwapperManger()
      manager.addSwapper(SwapperType.Thorchain, new ThorchainSwapper())
      expect(manager.getSwapper(SwapperType.Thorchain)).toBeInstanceOf(ThorchainSwapper)
    })

    it('should be chainable', async () => {
      const manager = new SwapperManger()
      manager
        .addSwapper(SwapperType.Thorchain, new ThorchainSwapper())
        .addSwapper(SwapperType.Zrx, new ZrxSwapper())
      expect(manager.getSwapper(SwapperType.Zrx)).toBeInstanceOf(ZrxSwapper)
    })

    it('should throw an error if adding an existing chain', () => {
      const swapper = new SwapperManger()
      expect(() => {
        swapper
          .addSwapper(SwapperType.Thorchain, new ThorchainSwapper())
          .addSwapper(SwapperType.Thorchain, new ZrxSwapper())
      }).toThrow('already exists')
    })
  })

  describe('getSwapper', () => {
    it('should return a swapper that has been added', () => {
      const swapper = new SwapperManger()
      swapper.addSwapper(SwapperType.Thorchain, new ThorchainSwapper())
      expect(swapper.getSwapper(SwapperType.Thorchain)).toBeInstanceOf(ThorchainSwapper)
    })

    it('should return the correct swapper', () => {
      const swapper = new SwapperManger()
      swapper
        .addSwapper(SwapperType.Thorchain, new ThorchainSwapper())
        .addSwapper(SwapperType.Zrx, new ZrxSwapper())

      expect(swapper.getSwapper(SwapperType.Thorchain)).toBeInstanceOf(ThorchainSwapper)
      expect(swapper.getSwapper(SwapperType.Zrx)).toBeInstanceOf(ZrxSwapper)
    })

    it('should throw an error if swapper is not set', () => {
      const swapper = new SwapperManger()
      expect(() => swapper.getSwapper(SwapperType.Thorchain)).toThrow(
        "SwapperError:getSwapper - Thorchain doesn't exist"
      )
    })

    it('should throw an error if an invalid Swapper instance is passed', () => {
      const manager = new SwapperManger()
      // @ts-ignore
      expect(() => manager.addSwapper(SwapperType.Thorchain, {})).toThrow(
        'SwapperError:validateSwapper - invalid swapper instance'
      )
    })
  })

  describe('removeSwapper', () => {
    it('should remove swapper and return this', () => {
      const swapper = new SwapperManger()
      swapper
        .addSwapper(SwapperType.Thorchain, new ThorchainSwapper())
        .removeSwapper(SwapperType.Thorchain)
      expect(() => swapper.getSwapper(SwapperType.Thorchain)).toThrow(
        `SwapperError:getSwapper - ${SwapperType.Thorchain} doesn't exist`
      )
    })

    it("should throw an error if swapper isn't set", () => {
      const swapper = new SwapperManger()
      expect(() => swapper.removeSwapper(SwapperType.Thorchain)).toThrow(
        `SwapperError:removeSwapper - ${SwapperType.Thorchain} doesn't exist`
      )
    })
  })
})
