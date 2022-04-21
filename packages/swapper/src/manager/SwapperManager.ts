import uniq from 'lodash/uniq'
import { GetQuoteInput, SwapperType } from '@shapeshiftoss/types'

import { Swapper } from '..'
import { BuyAssetBySellIdInput, SupportedSellAssetsInput } from '../api'

export class SwapperError extends Error {
  constructor(message: string) {
    super(message)
    this.message = `SwapperError:${message}`
  }
}

function validateSwapper(swapper: Swapper) {
  if (!(typeof swapper === 'object' && typeof swapper.getType === 'function'))
    throw new SwapperError('validateSwapper - invalid swapper instance')
}

// TODO: remove me
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
  addSwapper(swapperType: SwapperType, swapperInstance: Swapper): this {
    const swapper = this.swappers.get(swapperType)
    if (swapper) throw new SwapperError(`addSwapper - ${swapperType} already exists`)
    validateSwapper(swapperInstance)
    this.swappers.set(swapperType, swapperInstance)
    return this
  }

  /**
   *
   * @param swapperType swapper type {SwapperType|string}
   * @returns {Swapper}
   */
  getSwapper(swapperType: SwapperType): Swapper {
    const swapper = this.swappers.get(swapperType)
    if (!swapper) throw new SwapperError(`getSwapper - ${swapperType} doesn't exist`)
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
    quoteParams // noop to shut up linter
    return SwapperType.Zrx // TODO: implement getBestSwapper
  }

  getSupportedBuyAssetsFromSellId(args: BuyAssetBySellIdInput) {
    return uniq(
      Array.from(this.swappers.values()).flatMap((swapper: Swapper) =>
        swapper.filterBuyAssetsBySellAssetId(args)
      )
    )
  }

  getSupportedSellAssets(args: SupportedSellAssetsInput) {
    const { sellAssetIds } = args

    return uniq(
      Array.from(this.swappers.values()).flatMap((swapper: Swapper) =>
        swapper.filterAssetIdsBySellable(sellAssetIds)
      )
    )
  }
}
