import { Asset, ChainTypes } from '@shapeshiftoss/asset-service'
import { AxiosResponse } from 'axios'
import BigNumber from 'bignumber.js'
import { GetQuoteInput, Quote, QuoteResponse, Swapper, SwapperType } from '../../api'
import { getZrxQuote } from './getQuote/getQuote'
import { zrxService } from './utils'
export class ZrxError extends Error {
  constructor(message: string) {
    super(message)
    this.message = `ZrxError:${message}`
  }
}
export class ZrxSwapper implements Swapper {
  getType() {
    return SwapperType.Zrx
  }

  async getQuote(input: GetQuoteInput): Promise<Quote> {
    return getZrxQuote(input)
  }

  async getUsdRate(input: Pick<Asset, 'symbol' | 'tokenId'>): Promise<any> {
    const { symbol, tokenId } = input
    if (symbol === 'USDC') return '1'
    const rateResponse: AxiosResponse<QuoteResponse> = await zrxService.get<QuoteResponse>(
      '/swap/v1/price',
      {
        params: {
          buyToken: 'USDC',
          buyAmount: '1000000', // $1
          sellToken: tokenId || symbol
        }
      }
    )
    if (!rateResponse.data.price) throw new ZrxError('getUsdRate - Failed to get price data')

    return new BigNumber(1).dividedBy(rateResponse.data.price).toString()
  }

  getAvailableAssets(assets: Asset[]): Asset[] {
    return assets.filter((asset) => asset.chain === ChainTypes.Ethereum)
  }

  canTradePair(sellAsset: Asset, buyAsset: Asset): boolean {
    const availableAssets = this.getAvailableAssets([sellAsset, buyAsset])
    return availableAssets.length === 2
  }
}
