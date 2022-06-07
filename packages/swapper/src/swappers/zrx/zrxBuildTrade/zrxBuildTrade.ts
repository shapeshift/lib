import { fromAssetId } from '@shapeshiftoss/caip'
import { SupportedChainIds } from '@shapeshiftoss/types'
import { AxiosResponse } from 'axios'
import * as rax from 'retry-axios'

import { BuildTradeInput, SwapError, SwapErrorTypes, ZrxTrade } from '../../..'
import { bnOrZero } from '../../utils/bignumber'
import { ZrxQuoteResponse } from '../types'
import { erc20AllowanceAbi } from '../utils/abi/erc20Allowance-abi'
import { applyAxiosRetry } from '../utils/applyAxiosRetry'
import {
  AFFILIATE_ADDRESS,
  APPROVAL_GAS_LIMIT,
  DEFAULT_SLIPPAGE,
  DEFAULT_SOURCE
} from '../utils/constants'
import { getAllowanceRequired, normalizeAmount } from '../utils/helpers/helpers'
import { zrxService } from '../utils/zrxService'
import { ZrxSwapperDeps } from '../ZrxSwapper'

export async function zrxBuildTrade(
  { adapterManager, web3 }: ZrxSwapperDeps,
  input: BuildTradeInput
): Promise<ZrxTrade<SupportedChainIds>> {
  const {
    sellAsset,
    buyAsset,
    sellAmount,
    slippage,
    sellAssetAccountId,
    buyAssetAccountId,
    wallet
  } = input
  try {
    const { assetReference: buyAssetErc20Address, assetNamespace: buyAssetNamespace } = fromAssetId(
      buyAsset.assetId
    )
    const { assetReference: sellAssetErc20Address, assetNamespace: sellAssetNamespace } =
      fromAssetId(sellAsset.assetId)
    const buyToken = buyAssetNamespace === 'erc20' ? buyAssetErc20Address : buyAsset.symbol
    const sellToken = sellAssetNamespace === 'erc20' ? sellAssetErc20Address : sellAsset.symbol

    if (buyAsset.chainId !== 'eip155:1') {
      throw new SwapError('[ZrxBuildTrade] - buyAsset must be on chainId eip155:1', {
        code: SwapErrorTypes.VALIDATION_FAILED,
        details: { chainId: sellAsset.chainId }
      })
    }

    const adapter = await adapterManager.byChainId(buyAsset.chainId)
    const bip44Params = adapter.buildBIP44Params({ accountNumber: Number(buyAssetAccountId) })
    const receiveAddress = await adapter.getAddress({ wallet, bip44Params })

    const slippagePercentage = slippage ? bnOrZero(slippage).div(100).toString() : DEFAULT_SLIPPAGE

    /**
     * /swap/v1/quote
     * params: {
     *   sellToken: contract address (or symbol) of token to sell
     *   buyToken: contractAddress (or symbol) of token to buy
     *   sellAmount?: integer string value of the smallest increment of the sell token
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
    const quoteResponse: AxiosResponse<ZrxQuoteResponse> = await zrxRetry.get<ZrxQuoteResponse>(
      '/swap/v1/quote',
      {
        params: {
          buyToken,
          sellToken,
          sellAmount: normalizeAmount(sellAmount),
          takerAddress: receiveAddress,
          slippagePercentage,
          skipValidation: false,
          affiliateAddress: AFFILIATE_ADDRESS
        }
      }
    )

    const { data } = quoteResponse

    const estimatedGas = bnOrZero(data.gas || 0)

    const trade: ZrxTrade<'eip155:1'> = {
      sellAsset,
      buyAsset,
      sellAssetAccountId,
      receiveAddress,
      rate: data.price,
      depositAddress: data.to,
      feeData: {
        fee: bnOrZero(estimatedGas).multipliedBy(bnOrZero(data.gasPrice)).toString(),
        chainSpecific: {
          estimatedGas: estimatedGas.toString(),
          gasPrice: data.gasPrice
        },
        tradeFee: '0'
      },
      txData: data.data,
      sellAmount: data.sellAmount,
      buyAmount: data.buyAmount,
      sources: data.sources?.filter((s) => parseFloat(s.proportion) > 0) || DEFAULT_SOURCE
    }

    const allowanceRequired = await getAllowanceRequired({
      sellAsset,
      allowanceContract: data.allowanceTarget,
      receiveAddress,
      sellAmount: data.sellAmount,
      web3,
      erc20AllowanceAbi
    })

    if (allowanceRequired) {
      trade.feeData = {
        fee: trade.feeData?.fee || '0',
        chainSpecific: {
          ...trade.feeData?.chainSpecific,
          approvalFee: bnOrZero(APPROVAL_GAS_LIMIT).multipliedBy(bnOrZero(data.gasPrice)).toString()
        },
        tradeFee: '0'
      }
    }
    return trade
  } catch (e) {
    if (e instanceof SwapError) throw e
    throw new SwapError('[ZrxBuildTrade]', {
      code: SwapErrorTypes.BUILD_TRADE_FAILED
    })
  }
}
