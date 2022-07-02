import { fromAssetId } from '@shapeshiftoss/caip'
import { AxiosResponse } from 'axios'

import { BuildTradeInput, CowTrade, SwapError, SwapErrorTypes } from '../../../api'
import { erc20AllowanceAbi } from '../../utils/abi/erc20Allowance-abi'
import { bn, bnOrZero } from '../../utils/bignumber'
import { APPROVAL_GAS_LIMIT } from '../../utils/constants'
import { getAllowanceRequired, normalizeAmount } from '../../utils/helpers/helpers'
import { CowSwapperDeps } from '../CowSwapper'
import { CowSwapQuoteResponse } from '../types'
import {
  COW_SWAP_VAULT_RELAYER_ADDRESS,
  DEFAULT_APP_DATA,
  DEFAULT_SOURCE,
  ORDER_KIND_SELL,
  WETH_ASSET_ID
} from '../utils/constants'
import { cowService } from '../utils/cowService'
import { getNowPlusThirtyMinutesTimestamp, getUsdRate } from '../utils/helpers/helpers'

export async function CowBuildTrade(
  deps: CowSwapperDeps,
  input: BuildTradeInput
): Promise<CowTrade<'eip155:1'>> {
  try {
    const { sellAsset, buyAsset, sellAmount, sellAssetAccountNumber, wallet } = input
    const { adapter, assetService } = deps

    const { assetReference: sellAssetErc20Address, assetNamespace: sellAssetNamespace } =
      fromAssetId(sellAsset.assetId)
    const { assetReference: buyAssetErc20Address, assetNamespace: buyAssetNamespace } = fromAssetId(
      buyAsset.assetId
    )

    if (buyAssetNamespace !== 'erc20' || sellAssetNamespace !== 'erc20') {
      throw new SwapError('[CowBuildTrade] - Both assets need to be ERC-20 to use CowSwap', {
        code: SwapErrorTypes.UNSUPPORTED_PAIR,
        details: { buyAssetNamespace, sellAssetNamespace }
      })
    }

    const receiveAddress = await adapter.getAddress({ wallet })
    const normalizedSellAmount = normalizeAmount(sellAmount)

    /**
     * /v1/quote
     * params: {
     * sellToken: contract address of token to sell
     * buyToken: contractAddress of token to buy
     * receiver: receiver address can be defaulted to "0x0000000000000000000000000000000000000000"
     * validTo: time duration during which quote is valid (eg : 1654851610 as timestamp)
     * appData: appData for the CowSwap quote that can be used later, can be defaulted to "0x0000000000000000000000000000000000000000000000000000000000000000"
     * partiallyFillable: false
     * from: sender address can be defaulted to "0x0000000000000000000000000000000000000000"
     * kind: "sell" or "buy"
     * sellAmountBeforeFee / buyAmountAfterFee: amount in base unit
     * }
     */
    const quoteResponse: AxiosResponse<CowSwapQuoteResponse> =
      await cowService.post<CowSwapQuoteResponse>(`${deps.apiUrl}/v1/quote/`, {
        sellToken: sellAssetErc20Address,
        buyToken: buyAssetErc20Address,
        receiver: receiveAddress,
        validTo: getNowPlusThirtyMinutesTimestamp(),
        appData: DEFAULT_APP_DATA,
        partiallyFillable: false,
        from: receiveAddress,
        kind: ORDER_KIND_SELL,
        sellAmountBeforeFee: normalizedSellAmount
      })

    const { data } = quoteResponse
    const quote = data.quote

    const rate = bn(quote.buyAmount)
      .div(quote.sellAmount)
      .times(bn(10).exponentiatedBy(sellAsset.precision - buyAsset.precision))
      .toString()

    const wethAsset = assetService.getAll()[WETH_ASSET_ID]

    const [feeDataOptions, wethUsdRate, usdRateSellAsset] = await Promise.all([
      adapter.getFeeData({
        to: COW_SWAP_VAULT_RELAYER_ADDRESS,
        value: '0',
        chainSpecific: { from: receiveAddress, contractAddress: sellAssetErc20Address }
      }),
      getUsdRate(deps, wethAsset),
      getUsdRate(deps, sellAsset)
    ])
    const feeData = feeDataOptions['fast']

    const fee = bnOrZero(quote.feeAmount)
      .multipliedBy(bnOrZero(usdRateSellAsset))
      .div(bnOrZero(wethUsdRate))
      .div(bn(10).exponentiatedBy(sellAsset.precision - wethAsset.precision))
      .toString()

    const trade: CowTrade<'eip155:1'> = {
      rate,
      feeData: {
        fee,
        chainSpecific: {
          estimatedGas: feeData.chainSpecific.gasLimit,
          gasPrice: feeData.chainSpecific.gasPrice
        },
        tradeFee: '0'
      },
      sellAmount: normalizedSellAmount,
      buyAmount: quote.buyAmount,
      sources: DEFAULT_SOURCE,
      buyAsset,
      sellAsset,
      sellAssetAccountNumber,
      receiveAddress,
      feeAmountInSellToken: quote.feeAmount
    }

    const allowanceRequired = await getAllowanceRequired({
      sellAsset,
      allowanceContract: COW_SWAP_VAULT_RELAYER_ADDRESS,
      receiveAddress,
      sellAmount: quote.sellAmount,
      web3: deps.web3,
      erc20AllowanceAbi
    })

    if (!allowanceRequired.isZero()) {
      trade.feeData.chainSpecific.approvalFee = bnOrZero(APPROVAL_GAS_LIMIT)
        .multipliedBy(bnOrZero(feeData.chainSpecific.gasPrice))
        .toString()
    }

    return trade
  } catch (e) {
    if (e instanceof SwapError) throw e
    throw new SwapError('[CowBuildTrade]', {
      cause: e,
      code: SwapErrorTypes.TRADE_QUOTE_FAILED
    })
  }
}
