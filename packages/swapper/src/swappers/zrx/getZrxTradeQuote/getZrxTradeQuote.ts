import { SwapSource } from '@shapeshiftoss/types'
import { AxiosResponse } from 'axios'

import { GetTradeQuoteInput, SwapErrorTypes, TradeQuote } from '../../../api'
import { getZrxMinMax } from '../getZrxMinMax/getZrxMinMax'
import { ZrxPriceResponse } from '../types'
import { bn, bnOrZero } from '../utils/bignumber'
import { APPROVAL_GAS_LIMIT, DEFAULT_SOURCE } from '../utils/constants'
import { normalizeAmount } from '../utils/helpers/helpers'
import { zrxService } from '../utils/zrxService'
import { ZrxSwapError } from '../ZrxSwapper'

export async function getZrxTradeQuote(input: GetTradeQuoteInput): Promise<TradeQuote<'eip155:1'>> {
  const { sellAsset, buyAsset, sellAmount, sellAssetAccountId } = input
  if (buyAsset.chainId !== 'eip155:1' || sellAsset.chainId !== 'eip155:1') {
    throw new ZrxSwapError(SwapErrorTypes.UNSUPPORTED_PAIR, {
      cause: 'Both assets need to be on the Ethereum chain to use Zrx',
      details: { buyAssetChainId: buyAsset.chainId, sellAssetChainId: sellAsset.chainId }
    })
  }

  const useSellAmount = !!sellAmount
  const buyToken = buyAsset.tokenId || buyAsset.symbol
  const sellToken = sellAsset.tokenId || sellAsset.symbol

  const { minimum, maximum } = await getZrxMinMax(sellAsset, buyAsset)

  const minQuoteSellAmount = bnOrZero(minimum).times(bn(10).exponentiatedBy(sellAsset.precision))

  const normalizedSellAmount = normalizeAmount(
    bnOrZero(sellAmount).eq(0) ? minQuoteSellAmount.toString() : sellAmount
  )

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
    const quoteResponse: AxiosResponse<ZrxPriceResponse> = await zrxService.get<ZrxPriceResponse>(
      '/swap/v1/price',
      {
        params: {
          sellToken,
          buyToken,
          sellAmount: normalizedSellAmount
        }
      }
    )

    const { data } = quoteResponse

    const estimatedGas = bnOrZero(data.estimatedGas).times(1.5)
    const rate = useSellAmount ? data.price : bn(1).div(data.price).toString()

    return {
      success: true,
      statusReason: '',
      rate,
      minimum,
      maximum,
      feeData: {
        fee: bnOrZero(estimatedGas).multipliedBy(bnOrZero(data.gasPrice)).toString(),
        chainSpecific: {
          estimatedGas: estimatedGas.toString(),
          gasPrice: data.gasPrice,
          approvalFee:
            sellAsset.tokenId &&
            bnOrZero(APPROVAL_GAS_LIMIT).multipliedBy(bnOrZero(data.gasPrice)).toString()
        }
      },
      sellAmount: data.sellAmount,
      buyAmount: data.buyAmount,
      sources:
        data.sources?.filter((s: SwapSource) => parseFloat(s.proportion) > 0) || DEFAULT_SOURCE,
      allowanceContract: data.allowanceTarget,
      buyAsset,
      sellAsset,
      sellAssetAccountId
    }
  } catch (e) {
    const statusReason =
      e?.response?.data?.validationErrors?.[0]?.reason ||
      e?.response?.data?.reason ||
      'Unknown Error'
    // This hackyness will go away when we correctly handle errors
    return {
      success: false,
      statusReason,
      maximum: '0',
      minimum: '0',
      rate: '0',
      feeData: { fee: '0', chainSpecific: {} },
      buyAmount: '0',
      sellAmount: '0',
      sources: [],
      allowanceContract: '0',
      buyAsset,
      sellAsset,
      sellAssetAccountId
    }
  }
}
