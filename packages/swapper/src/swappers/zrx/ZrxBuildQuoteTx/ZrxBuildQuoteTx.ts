import { BuildQuoteTxInput, ChainTypes, Quote, QuoteResponse } from '@shapeshiftoss/types'
import { AxiosResponse } from 'axios'
import * as rax from 'retry-axios'

import { SwapError } from '../../..'
import { erc20AllowanceAbi } from '../utils/abi/erc20Allowance-abi'
import { applyAxiosRetry } from '../utils/applyAxiosRetry'
import { bnOrZero } from '../utils/bignumber'
import {
  AFFILIATE_ADDRESS,
  APPROVAL_GAS_LIMIT,
  DEFAULT_SLIPPAGE,
  DEFAULT_SOURCE,
  MAX_SLIPPAGE
} from '../utils/constants'
import { getAllowanceRequired, normalizeAmount } from '../utils/helpers/helpers'
import { zrxService } from '../utils/zrxService'
import { ZrxSwapperDeps } from '../ZrxSwapper'

export async function ZrxBuildQuoteTx(
  { adapterManager, web3 }: ZrxSwapperDeps,
  { input, wallet }: BuildQuoteTxInput
): Promise<Quote<ChainTypes>> {
  const {
    sellAsset,
    buyAsset,
    sellAmount,
    buyAmount,
    slippage,
    sellAssetAccountId,
    buyAssetAccountId
  } = input

  if ((buyAmount && sellAmount) || (!buyAmount && !sellAmount)) {
    throw new SwapError(
      'ZrxSwapper:ZrxBuildQuoteTx Exactly one of buyAmount or sellAmount is required'
    )
  }

  if (!sellAssetAccountId || !buyAssetAccountId) {
    throw new SwapError(
      'ZrxSwapper:ZrxBuildQuoteTx Both sellAssetAccountId and buyAssetAccountId are required'
    )
  }

  const buyToken = buyAsset.tokenId || buyAsset.symbol || buyAsset.network
  const sellToken = sellAsset.tokenId || sellAsset.symbol || sellAsset.network
  if (!buyToken) {
    throw new SwapError(
      'ZrxSwapper:ZrxBuildQuoteTx One of buyAssetContract or buyAssetSymbol or buyAssetNetwork are required'
    )
  }
  if (!sellToken) {
    throw new SwapError(
      'ZrxSwapper:ZrxBuildQuoteTx One of sellAssetContract or sellAssetSymbol or sellAssetNetwork are required'
    )
  }

  if (buyAsset.chain !== ChainTypes.Ethereum) {
    throw new SwapError(
      `ZrxSwapper:ZrxBuildQuoteTx buyAsset must be on chain [${ChainTypes.Ethereum}]`
    )
  }

  const adapter = adapterManager.byChain(buyAsset.chain)
  const bip44Params = adapter.buildBIP44Params({ accountNumber: Number(buyAssetAccountId) })
  const receiveAddress = await adapter.getAddress({ wallet, bip44Params })

  if (bnOrZero(slippage).gt(MAX_SLIPPAGE)) {
    throw new SwapError(
      `ZrxSwapper:ZrxBuildQuoteTx slippage value of ${slippage} is greater than max slippage value of ${MAX_SLIPPAGE}`
    )
  }

  const slippagePercentage = slippage ? bnOrZero(slippage).div(100).toString() : DEFAULT_SLIPPAGE

  try {
    /**
     * /swap/v1/quote
     * params: {
     *   sellToken: contract address (or symbol) of token to sell
     *   buyToken: contractAddress (or symbol) of token to buy
     *   sellAmount?: integer string value of the smallest increment of the sell token
     *   buyAmount?: integer string value of the smallest incremtent of the buy token
     * }
     */

    const zrxRetry = applyAxiosRetry(zrxService, {
      statusCodesToRetry: [[400, 400]],
      shouldRetry: (err) => {
        const cfg = rax.getConfig(err)
        const retryAttempt = cfg?.currentRetryAttempt ?? 0
        const retry = cfg?.retry ?? 3
        // ensure max retries is always respected
        if (retryAttempt >= retry) return false
        // retry if 0x returns error code 111 Gas estimation failed
        if (err?.response?.data?.code === 111) return true

        // Handle the request based on your other config options, e.g. `statusCodesToRetry`
        return rax.shouldRetryRequest(err)
      }
    })
    const quoteResponse: AxiosResponse<QuoteResponse> = await zrxRetry.get<QuoteResponse>(
      '/swap/v1/quote',
      {
        params: {
          buyToken,
          sellToken,
          sellAmount: normalizeAmount(sellAmount?.toString()),
          buyAmount: normalizeAmount(buyAmount?.toString()),
          takerAddress: receiveAddress,
          slippagePercentage,
          skipValidation: false,
          affiliateAddress: AFFILIATE_ADDRESS
        }
      }
    )

    const { data } = quoteResponse

    const estimatedGas = bnOrZero(data.gas)
    const quote: Quote<ChainTypes.Ethereum> = {
      sellAsset,
      buyAsset,
      sellAssetAccountId,
      buyAssetAccountId,
      receiveAddress,
      success: true,
      rate: data.price,
      depositAddress: data.to,
      feeData: {
        fee: bnOrZero(estimatedGas).multipliedBy(bnOrZero(data.gasPrice)).toString(),
        chainSpecific: {
          estimatedGas: estimatedGas.toString(),
          gasPrice: data.gasPrice
        }
      },
      txData: data.data,
      sellAmount: data.sellAmount,
      buyAmount: data.buyAmount,
      allowanceContract: data.allowanceTarget,
      sources: data.sources?.filter((s) => parseFloat(s.proportion) > 0) || DEFAULT_SOURCE
    }

    if (!data.allowanceTarget) throw new SwapError('ZrxSwapper:ZrxBuildQuoteTx no allowance target')
    if (!data.sellAmount) throw new SwapError('ZrxSwapper:ZrxBuildQuoteTx no sell amount')

    const allowanceRequired = await getAllowanceRequired({
      sellAsset,
      allowanceContract: data.allowanceTarget,
      receiveAddress,
      sellAmount: data.sellAmount,
      web3,
      erc20AllowanceAbi
    })

    if (allowanceRequired) {
      quote.feeData = {
        fee: quote.feeData?.fee || '0',
        chainSpecific: {
          ...quote.feeData?.chainSpecific,
          approvalFee: bnOrZero(APPROVAL_GAS_LIMIT)
            .multipliedBy(data.gasPrice || 0)
            .toString()
        }
      }
    }
    return quote
  } catch (e) {
    const statusReason =
      e?.response?.data?.validationErrors?.[0]?.reason ||
      e?.response?.data?.reason ||
      'Unknown Error'
    return {
      sellAsset,
      buyAsset,
      success: false,
      statusReason
    }
  }
}
