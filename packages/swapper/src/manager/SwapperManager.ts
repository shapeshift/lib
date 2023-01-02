import { ChainId } from '@shapeshiftoss/caip'
import uniq from 'lodash/uniq'

import {
  BuyAssetBySellIdInput,
  ByPairInput,
  GetBestSwapperArgs,
  SupportedSellAssetsInput,
  Swapper,
  TradeQuote,
} from '..'
import { SwapError, SwapErrorTypes, SwapperType } from '../api'
import { isFulfilled } from '../typeGuards'
import { getRatioFromQuote } from './utils'

type SwapperQuoteTuple = readonly [swapper: Swapper<ChainId>, quote: TradeQuote<ChainId>]

function validateSwapper(swapper: Swapper<ChainId>) {
  if (!(typeof swapper === 'object' && typeof swapper.getType === 'function'))
    throw new SwapError('[validateSwapper] - invalid swapper instance', {
      code: SwapErrorTypes.MANAGER_ERROR,
    })
}

// TODO: remove me
export class SwapperManager {
  public swappers: Map<SwapperType, Swapper<ChainId>>

  constructor() {
    this.swappers = new Map<SwapperType, Swapper<ChainId>>()
  }

  /**
   *
   * @param swapperInstance swapper instance {Swapper}
   * @returns {SwapperManager}
   */
  addSwapper(swapperInstance: Swapper<ChainId>): this {
    validateSwapper(swapperInstance)
    const swapperType = swapperInstance.getType()
    this.swappers.set(swapperType, swapperInstance)
    return this
  }

  /**
   *
   * @param swapperType swapper type {SwapperType|string}
   * @returns {Swapper}
   */
  getSwapper(swapperType: SwapperType): Swapper<ChainId> {
    const swapper = this.swappers.get(swapperType)
    if (!swapper)
      throw new SwapError('[getSwapper] - swapperType doesnt exist', {
        code: SwapErrorTypes.MANAGER_ERROR,
        details: { swapperType },
      })
    return swapper
  }

  /**
   *
   * @param swapperType swapper type {SwapperType|string}
   * @returns {SwapperManager}
   */
  removeSwapper(swapperType: SwapperType): this {
    const swapper = this.swappers.get(swapperType)
    if (!swapper)
      throw new SwapError('[removeSwapper] - swapperType doesnt exist', {
        code: SwapErrorTypes.MANAGER_ERROR,
        details: { swapperType },
      })
    this.swappers.delete(swapperType)
    return this
  }

  async getBestSwapper(args: GetBestSwapperArgs): Promise<Swapper<ChainId> | undefined> {
    const { sellAsset, buyAsset, feeAsset } = args

    // Get all swappers that support the pair
    const supportedSwappers: Swapper<ChainId>[] = this.getSwappersByPair({
      sellAssetId: sellAsset.assetId,
      buyAssetId: buyAsset.assetId,
    })

    // Get quotes from all swappers that support the pair
    const quotePromises: Promise<SwapperQuoteTuple>[] = supportedSwappers.map(
      async (swapper) => [swapper, await swapper.getTradeQuote(args)] as const,
    )
    const settledQuoteRequests = await Promise.allSettled(quotePromises)
    // For each swapper, get output amount/(input amount + gas fee), where all values are in fiat
    const fulfilledQuoteTuples = settledQuoteRequests
      .filter(isFulfilled)
      .map((quoteRequest) => quoteRequest.value)

    // The best swapper is the one with the highest ratio above
    const bestQuoteTuple = await fulfilledQuoteTuples.reduce(
      async (
        acc: Promise<readonly [Swapper<ChainId>, number]> | undefined,
        currentQuoteTuple: SwapperQuoteTuple,
      ) => {
        console.log('xxx getBestSwapper: checking swapper and quote', { currentQuoteTuple })
        const resolvedAcc = await acc
        const [currentSwapper, currentQuote] = currentQuoteTuple
        const currentRatio = await getRatioFromQuote(currentQuote, currentSwapper, feeAsset)
        console.log('xxx getBestSwapper: got ratio', { currentRatio })
        if (!resolvedAcc) return Promise.resolve([currentSwapper, currentRatio] as const)

        const [, bestRatio] = resolvedAcc
        const isCurrentBest = bestRatio < currentRatio
        return Promise.resolve(
          isCurrentBest ? ([currentSwapper, currentRatio] as const) : resolvedAcc,
        )
      },
      undefined,
    )

    const bestSwapper = bestQuoteTuple?.[0]
    console.log('xxx getBestSwapper: bestSwapper', { bestSwapper })
    return bestSwapper
  }

  /**
   *
   * @param pair type {GetQuoteInput}
   * @returns {SwapperType}
   */
  getSwappersByPair(pair: ByPairInput): Swapper<ChainId>[] {
    const { sellAssetId, buyAssetId } = pair
    const availableSwappers = Array.from(this.swappers.values())
    return availableSwappers.filter(
      (swapper: Swapper<ChainId>) =>
        swapper.filterBuyAssetsBySellAssetId({ sellAssetId, assetIds: [buyAssetId] }).length,
    )
  }

  getSupportedBuyAssetIdsFromSellId(args: BuyAssetBySellIdInput) {
    return uniq(
      Array.from(this.swappers.values()).flatMap((swapper: Swapper<ChainId>) =>
        swapper.filterBuyAssetsBySellAssetId(args),
      ),
    )
  }

  getSupportedSellableAssetIds(args: SupportedSellAssetsInput) {
    const { assetIds } = args

    return uniq(
      Array.from(this.swappers.values()).flatMap((swapper: Swapper<ChainId>) =>
        swapper.filterAssetIdsBySellable(assetIds),
      ),
    )
  }
}
