import { fromAssetId } from '@shapeshiftoss/caip'
import { AxiosResponse } from 'axios'

import { GetTradeQuoteInput, SwapError, SwapErrorTypes, TradeQuote } from '../../../api'
import { bn, bnOrZero } from '../../utils/bignumber'
import { APPROVAL_GAS_LIMIT, DEFAULT_SOURCE } from '../../zrx/utils/constants'
// TODO change normalizeAmount import when merged / conflicts
import { normalizeAmount } from '../../zrx/utils/helpers/helpers'
import { CowSwapperDeps } from '../CowSwapper'
import { getCowSwapMinMax } from '../getCowSwapMinMax/getCowSwapMinMax'
import { CowSwapQuoteResponse } from '../types'
import { cowService } from '../utils/cowService'
import { getUsdRate } from '../utils/helpers/helpers'

export async function getCowSwapTradeQuote(
  deps: CowSwapperDeps,
  input: GetTradeQuoteInput
): Promise<TradeQuote<'eip155:1'>> {
  try {
    const { sellAsset, buyAsset, sellAmount, sellAssetAccountId } = input

    const { assetReference: sellAssetErc20Address, assetNamespace: sellAssetNamespace } =
      fromAssetId(sellAsset.assetId)
    const { assetReference: buyAssetErc20Address, assetNamespace: buyAssetNamespace } = fromAssetId(
      buyAsset.assetId
    )

    if (buyAssetNamespace !== 'erc20' || sellAssetNamespace !== 'erc20') {
      throw new SwapError('[getCowSwapTradeQuote] - Both assets need to be ERC-20 to use CowSwap', {
        code: SwapErrorTypes.UNSUPPORTED_PAIR,
        details: { buyAssetNamespace, sellAssetNamespace }
      })
    }

    const useSellAmount = !!sellAmount
    const { minimum, maximum } = await getCowSwapMinMax(deps, sellAsset, buyAsset)

    const minQuoteSellAmount = bnOrZero(minimum).times(bn(10).exponentiatedBy(sellAsset.precision))

    const normalizedSellAmount = normalizeAmount(
      bnOrZero(sellAmount).eq(0) ? minQuoteSellAmount : sellAmount
    )

    /**
     * /v1/quote
     * params: {
     * sellToken: contract address of token to sell
     * buyToken: contractAddress of token to buy
     * receiver: receiver address can be defaulted to "0x0000000000000000000000000000000000000000"
     * validTo: time duration during which quote is valid (eg : 1654851610 as timestamp)
     * appData: appData for the CowSwap quote that can be used later
     * partiallyFillable: false
     * from: sender address can be defaulted to "0x0000000000000000000000000000000000000000"
     * kind: "sell" or "buy"
     * sellAmountBeforeFee / buyAmountAfterFee: amount in base unit
     *
     *
     * }
     */
    const quoteResponse: AxiosResponse<CowSwapQuoteResponse> =
      await cowService.post<CowSwapQuoteResponse>(`${deps.apiUrl}/v1/quote/`, {
        sellToken: sellAssetErc20Address,
        buyToken: buyAssetErc20Address,
        receiver: '0x0000000000000000000000000000000000000000',
        validTo: '4294967295', // TODO,
        appData: '0x0000000000000000000000000000000000000000',
        partiallyFillable: false,
        from: '0x0000000000000000000000000000000000000000',
        kind: 'sell',
        sellAmountBeforeFee: normalizedSellAmount
      })

    const { data } = quoteResponse
    const quote = data.quote

    //const estimatedGas = bnOrZero(data.estimatedGas).times(1.5)
    //const rate = quote.sellAmount
    const rate = useSellAmount ? quote.sellAmount : bn(1).div(quote.sellAmount).toString()
    const gasPrice = '50000' // TODO

    const usdRateSellAsset = await getUsdRate(deps, sellAsset)
    const feeUsd = bnOrZero(quote.feeAmount)
      .div(bn(10).exponentiatedBy(sellAsset.precision))
      .multipliedBy(bnOrZero(usdRateSellAsset))
      .toString()

    return {
      rate,
      minimum,
      maximum,
      feeData: {
        fee: feeUsd,
        //fee: bnOrZero(estimatedGas).multipliedBy(bnOrZero(gasPrice)).toString(),
        chainSpecific: {
          estimatedGas: '0',
          gasPrice,
          approvalFee:
            sellAssetErc20Address &&
            bnOrZero(APPROVAL_GAS_LIMIT).multipliedBy(bnOrZero(gasPrice)).toString()
        },
        tradeFee: '0'
      },
      sellAmount: quote.sellAmount,
      buyAmount: quote.buyAmount,
      sources: DEFAULT_SOURCE,
      allowanceContract: '', //data.allowanceTarget,
      buyAsset,
      sellAsset,
      sellAssetAccountId
    }
  } catch (e) {
    if (e instanceof SwapError) throw e
    throw new SwapError('[getCowSwapTradeQuote]', {
      cause: e,
      code: SwapErrorTypes.TRADE_QUOTE_FAILED
    })
  }
}
