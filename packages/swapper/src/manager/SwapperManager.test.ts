import { SwapperType } from '../api'
import { ThorchainSwapper, ZrxSwapper } from '../swappers'
import { SwapperManger } from './SwapperManager'

describe('SwapperManager', () => {
  describe('constructor', () => {
    it('should return an instance', () => {
      expect(new SwapperManger()).toBeInstanceOf(SwapperManger)
    })
  })

  describe('addSwapper', () => {
    it('should add swapper', () => {
      const swapper = new SwapperManger()
      swapper.addSwapper(SwapperType.ThorChain, () => new ThorchainSwapper())
      expect(swapper.bySwapper(SwapperType.ThorChain)).toBeInstanceOf(ThorchainSwapper)
    })

    it('should be chainable', async () => {
      const swapper = new SwapperManger()
      swapper
        .addSwapper(SwapperType.ThorChain, () => new ThorchainSwapper())
        .addSwapper(SwapperType.Zrx, () => new ZrxSwapper())
      expect(swapper.bySwapper(SwapperType.Zrx)).toBeInstanceOf(ZrxSwapper)
    })

    it('should throw an error if adding an existing chain', () => {
      const swapper = new SwapperManger()
      expect(() => {
        swapper
          .addSwapper(SwapperType.ThorChain, () => new ThorchainSwapper())
          .addSwapper(SwapperType.ThorChain, () => new ZrxSwapper())
      }).toThrow('already exists')
    })
  })

  describe('bySwapper', () => {
    it('should return a swapper that has been added', () => {
      const swapper = new SwapperManger()
      swapper.addSwapper(SwapperType.ThorChain, () => new ThorchainSwapper())
      expect(swapper.bySwapper(SwapperType.ThorChain)).toBeInstanceOf(ThorchainSwapper)
    })

    it('should return the correct swapper', () => {
      const swapper = new SwapperManger()
      swapper
        .addSwapper(SwapperType.ThorChain, () => new ThorchainSwapper())
        .addSwapper(SwapperType.Zrx, () => new ZrxSwapper())
      expect(swapper.bySwapper(SwapperType.ThorChain)).toBeInstanceOf(ThorchainSwapper)
      expect(swapper.bySwapper(SwapperType.Zrx)).toBeInstanceOf(ZrxSwapper)
    })

    it('should throw an error if swapper is not set', () => {
      const swapper = new SwapperManger()
      expect(() => swapper.bySwapper(SwapperType.ThorChain)).toThrow()
    })

    it('should throw an error if swapper is not set', () => {
      const swapper = new SwapperManger()
      // @ts-ignore
      swapper.addSwapper(SwapperType.ThorChain, () => {
        throw new Error('test')
      })
      expect(() => swapper.bySwapper(SwapperType.ThorChain)).toThrow('test')
    })
  })

  describe('removeSwapper', () => {
    it('should remove swapper and return this', () => {
      const swapper = new SwapperManger()
      swapper
        .addSwapper(SwapperType.ThorChain, () => new ThorchainSwapper())
        .removeSwapper(SwapperType.ThorChain)
      expect(swapper.bySwapper(SwapperType.ThorChain)).toBeUndefined()
    })

    it("should throw an error if swapper isn't set", () => {})
  })
})
