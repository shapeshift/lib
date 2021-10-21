import { Swapper } from '..'
import { swapper } from '@shapeshiftoss/types'

export class SwapperError extends Error {
  constructor(message: string) {
    super(message)
    this.message = `SwapperError:${message}`
  }
}

function validateSwapper(swapperInstance: Swapper) {
  if (!(typeof swapperInstance === 'object' && typeof swapperInstance.getType === 'function'))
    throw new SwapperError('validateSwapper - invalid swapper instance')
}

export class SwapperManager {
  public swappers: Map<swapper.Type, Swapper>

  constructor() {
    this.swappers = new Map<swapper.Type, Swapper>()
  }

  /**
   *
   * @param type swapper type {swapper.Type|string}
   * @param swapperInstance swapper instance {Swapper}
   * @returns {SwapperManager}
   */
  addSwapper(type: swapper.Type, swapperInstance: Swapper): this {
    const currentSwapper = this.swappers.get(type)
    if (currentSwapper) throw new SwapperError(`addSwapper - ${type} already exists`)
    validateSwapper(swapperInstance)
    this.swappers.set(type, swapperInstance)
    return this
  }

  /**
   *
   * @param type swapper type {swapper.Type|string}
   * @returns {Swapper}
   */
  getSwapper(type: swapper.Type): Swapper {
    const currentSwapper = this.swappers.get(type)
    if (!currentSwapper) throw new SwapperError(`getSwapper - ${type} doesn't exist`)
    return currentSwapper
  }

  /**
   *
   * @param type swapper type {swapper.Type|string}
   * @returns {SwapperManager}
   */
  removeSwapper(type: swapper.Type): this {
    const currentSwapper = this.swappers.get(type)
    if (!currentSwapper) throw new SwapperError(`removeSwapper - ${type} doesn't exist`)
    this.swappers.delete(type)
    return this
  }

  async getBestSwapper(quoteParams: swapper.GetQuoteInput): Promise<swapper.Type> {
    console.info('quote', quoteParams)
    return swapper.Type.Zrx // TODO: implement getBestSwapper
  }
}
