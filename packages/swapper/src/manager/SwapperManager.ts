import { GetQuoteInput, SwapperType } from '@shapeshiftoss/types'

import { Swapper } from '..'

export class SwapperError extends Error {
  constructor(message: string) {
    super(message)
    this.message = `SwapperError:${message}`
  }
}

function validateSwapper<T extends SwapperType>(
  swapperType: T,
  swapper: Swapper
): asserts swapper is Swapper<T> {
  if (!(typeof swapper === 'object' && typeof swapper.getType === 'function'))
    throw new SwapperError('validateSwapper - invalid swapper instance')
  if (swapper.getType() !== swapperType)
    throw new SwapperError('validateSwapper - wrong swapper type')
}

export class SwapperManager {
  public swappers: Map<SwapperType, Swapper>

  constructor() {
    this.swappers = new Map<SwapperType, Swapper>()
  }

  /**
   *
   * @param swapperType swapper type {SwapperType|string}
   * @param swapperInstance swapper instance {Swapper}
   * @returns {SwapperManager}
   */
  addSwapper<T extends SwapperType>(swapperType: T, swapperInstance: Swapper<T>): this {
    const swapper = this.swappers.get(swapperType)
    if (swapper) throw new SwapperError(`addSwapper - ${swapperType} already exists`)
    validateSwapper(swapperType, swapperInstance)
    this.swappers.set(swapperType, swapperInstance)
    return this
  }

  /**
   *
   * @param swapperType swapper type {SwapperType|string}
   * @returns {Swapper}
   */
  getSwapper<T extends SwapperType>(swapperType: T): Swapper<T> {
    const swapper = this.swappers.get(swapperType)
    if (!swapper) throw new SwapperError(`getSwapper - ${swapperType} doesn't exist`)
    validateSwapper(swapperType, swapper)
    return swapper
  }

  /**
   *
   * @param swapperType swapper type {SwapperType|string}
   * @returns {SwapperManager}
   */
  removeSwapper(swapperType: SwapperType): this {
    const swapper = this.swappers.get(swapperType)
    if (!swapper) throw new SwapperError(`removeSwapper - ${swapperType} doesn't exist`)
    this.swappers.delete(swapperType)
    return this
  }

  async getBestSwapper(quoteParams: GetQuoteInput): Promise<SwapperType> {
    console.info('quote', quoteParams)
    return SwapperType.Zrx // TODO: implement getBestSwapper
  }
}
