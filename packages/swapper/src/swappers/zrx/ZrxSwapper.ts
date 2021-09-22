import BigNumber from 'bignumber.js'
import { ChainTypes } from '../../../../asset-service/dist'
import { GetQuoteInput, Quote, QuoteResponse, Swapper, SwapperType } from '../../api'
import { APPROVAL_GAS_LIMIT, DEFAULT_SOURCE, MAX_ZRX_TRADE } from '../../utils/constants'
import { AxiosResponse } from 'axios'
import { zrxService } from './utils'
import { SwapSource } from '../..'
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

  private normalizeAmount(amount: string | undefined): string | undefined {
    if (!amount) return undefined
    return new BigNumber(amount).toNumber().toLocaleString('fullwide', { useGrouping: false })
  }

  /**
   * Get a basic quote (rate) for the pair
   * @param input
   */
  async getQuote(input: GetQuoteInput): Promise<Quote | undefined> {
    const {
      sellAsset,
      buyAsset,
      sellAmount,
      minimumPrice,
      minimum: minQuoteSellAmount,
      slippage
    } = input
    if (!sellAmount) {
      throw new ZrxError('getQuote - sellAmount is required')
    }

    if (buyAsset.chain !== ChainTypes.Ethereum) {
      throw new ZrxError('getQuote - Both assets need to be on the Ethereum chain to use Zrx')
    }
    if (sellAsset.chain !== ChainTypes.Ethereum) {
      throw new ZrxError('getQuote - Both assets need to be on the Ethereum chain to use Zrx')
    }

    const buyToken = buyAsset.tokenId || buyAsset.symbol
    const sellToken = sellAsset.tokenId || sellAsset.symbol

    const minQuoteSellAmountWei = minQuoteSellAmount
      ? new BigNumber(minQuoteSellAmount as string).times(
          new BigNumber(10).exponentiatedBy(sellAsset.precision)
        )
      : null

    const normalizedSellAmount =
      !this.normalizeAmount(sellAmount) || this.normalizeAmount(sellAmount) === '0'
        ? this.normalizeAmount(minQuoteSellAmountWei?.toString())
        : this.normalizeAmount(sellAmount)

    if (!normalizedSellAmount || normalizedSellAmount === '0') {
      throw new ZrxError('getQuote - Must have valid sellAmount or minimum amount')
    }

    const slippagePercentage = slippage ? new BigNumber(slippage).div(100).toString() : undefined

    try {
      /**
       * /swap/v1/price
       * params: {
       *   sellToken: contract address (or symbol) of token to sell
       *   buyToken: contractAddress (or symbol) of token to buy
       *   sellAmount?: integer string value of the smallest increment of the sell token
       *   buyAmount?: integer string value of the smallest incremtent of the buy token
       * }
       */
      const quoteResponse: AxiosResponse<QuoteResponse> = await zrxService.get<QuoteResponse>(
        '/swap/v1/price',
        {
          params: {
            sellToken,
            buyToken,
            sellAmount: normalizedSellAmount,
            slippagePercentage
          }
        }
      )
      const quotePrice = new BigNumber(quoteResponse?.data?.price)
      const priceDifference = quotePrice.minus(minimumPrice as string)
      const priceImpact = priceDifference
        .dividedBy(minimumPrice as string)
        .abs()
        .valueOf()

      const { data } = quoteResponse
      /**
       * estimatedGas from 0x price endpoint is never accurate and often too low
       * Low estimate causes our sendmax to be too high and fail on getQuote from 0x because amount+accurateQuoteFee > balance
       * DEFAULT_GAS_ESTIMATE is a high estimate that should leave enough buffer room on sendmax transactions
       */
      const estimatedGas = quoteResponse?.data?.estimatedGas
        ? new BigNumber(quoteResponse.data.estimatedGas).times(1.5)
        : new BigNumber(0)
      return {
        sellAsset,
        buyAsset,
        priceImpact,
        slippage,
        success: true,
        statusCode: 0,
        rate: data.price,
        minimum: minQuoteSellAmount, // $1 worth of the sell token.
        maximum: MAX_ZRX_TRADE, // Arbitrarily large value. 10e+28 here.
        feeData: {
          fee: new BigNumber(estimatedGas || 0)
            .multipliedBy(new BigNumber(data.gasPrice || 0))
            .toString(),
          estimatedGas: estimatedGas.toString(),
          gasPrice: data.gasPrice,
          approvalFee:
            sellAsset.tokenId &&
            new BigNumber(APPROVAL_GAS_LIMIT).multipliedBy(data.gasPrice || 0).toString()
        },
        sellAmount: data.sellAmount,
        buyAmount: data.buyAmount,
        guaranteedPrice: data.guaranteedPrice,
        sources:
          data.sources?.filter((s: SwapSource) => parseFloat(s.proportion) > 0) || DEFAULT_SOURCE
      }
    } catch (e) {
      const statusCode = e?.response.data.validationErrors?.[0]?.code || e.response.data.code || -1
      return {
        sellAsset,
        buyAsset,
        minimum: minQuoteSellAmount,
        maximum: MAX_ZRX_TRADE,
        success: false,
        statusCode,
        statusReason:
          e.response.data.validationErrors?.[0]?.reason || e.response.data.reason || 'Unknown Error'
      }
    }
  }
}
