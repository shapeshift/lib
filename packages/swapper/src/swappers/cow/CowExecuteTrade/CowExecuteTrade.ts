import { fromAssetId } from '@shapeshiftoss/caip'
import { AxiosResponse } from 'axios'

import { CowTrade, ExecuteTradeInput, SwapError, SwapErrorTypes, TradeResult } from '../../../api'
import { CowSwapperDeps } from '../CowSwapper'
import { CowSwapOrdersResponse } from '../types'
import { DEFAULT_APP_DATA, ORDER_KIND_SELL, SIGNING_SCHEME } from '../utils/constants'
import { cowService } from '../utils/cowService'
import { getNowPlusThirtyMinutesTimestamp } from '../utils/helpers/helpers'

export async function CowExecuteTrade(
  { apiUrl }: CowSwapperDeps,
  { trade }: ExecuteTradeInput<'eip155:1'>
): Promise<TradeResult> {
  const cowTrade = trade as CowTrade<'eip155:1'>
  const { sellAsset, buyAsset, feeAmountInSellToken } = cowTrade

  const { assetReference: sellAssetErc20Address, assetNamespace: sellAssetNamespace } = fromAssetId(
    sellAsset.assetId
  )
  const { assetReference: buyAssetErc20Address, assetNamespace: buyAssetNamespace } = fromAssetId(
    buyAsset.assetId
  )

  if (buyAssetNamespace !== 'erc20' || sellAssetNamespace !== 'erc20') {
    throw new SwapError('[CowExecuteTrade] - Both assets need to be ERC-20 to use CowSwap', {
      code: SwapErrorTypes.UNSUPPORTED_PAIR,
      details: { buyAssetNamespace, sellAssetNamespace }
    })
  }

  try {
    /**
     * /v1/orders
     * params: {
     * sellToken: contract address of token to sell
     * buyToken: contractAddress of token to buy
     * receiver: receiver address
     * validTo: time duration during which order is valid (putting current timestamp + 30 minutes for real order)
     * appData: appData that can be used later, can be defaulted to "0x0000000000000000000000000000000000000000000000000000000000000000"
     * partiallyFillable: false
     * from: sender address
     * kind: "sell" or "buy"
     * feeAmount: amount of fee in sellToken base
     * signature: a signed message specific to cowswap for this order
     * signingScheme: the signing scheme used for the signature
     * }
     */
    const ordersResponse: AxiosResponse<CowSwapOrdersResponse> =
      await cowService.post<CowSwapOrdersResponse>(`${apiUrl}/v1/orders/`, {
        sellToken: sellAssetErc20Address,
        buyToken: buyAssetErc20Address,
        receiver: trade.receiveAddress,
        sellAmount: trade.sellAmount,
        buyAmount: trade.buyAmount,
        validTo: getNowPlusThirtyMinutesTimestamp(),
        appData: DEFAULT_APP_DATA,
        feeAmount: feeAmountInSellToken,
        kind: ORDER_KIND_SELL,
        partiallyFillable: false,
        signingScheme: SIGNING_SCHEME,
        signature: '',
        from: trade.receiveAddress
      })

    return { tradeId: ordersResponse.data.uid }
  } catch (e) {
    if (e instanceof SwapError) throw e
    throw new SwapError('[CowExecuteTrade]', {
      cause: e,
      code: SwapErrorTypes.EXECUTE_TRADE_FAILED
    })
  }
}
