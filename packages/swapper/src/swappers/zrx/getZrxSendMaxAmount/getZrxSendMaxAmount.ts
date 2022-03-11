import { AssetNamespace, caip19, WellKnownChain } from '@shapeshiftoss/caip'
import { chainAdapters, SendMaxAmountInput } from '@shapeshiftoss/types'
import BigNumber from 'bignumber.js'

import { SwapError } from '../../../api'
import { bnOrZero } from '../utils/bignumber'
import { ETH_FEE_ESTIMATE_PADDING } from '../utils/constants'
import { ZrxSwapperDeps } from '../ZrxSwapper'

export async function getZrxSendMaxAmount(
  { adapterManager }: ZrxSwapperDeps,
  {
    wallet,
    quote,
    sellAssetAccountId,
    feeEstimateKey = chainAdapters.FeeDataKey.Average
  }: SendMaxAmountInput
): Promise<string> {
  const adapter = await adapterManager.byChainId(WellKnownChain.EthereumMainnet)
  const bip44Params = adapter.buildBIP44Params({
    accountNumber: bnOrZero(sellAssetAccountId).toNumber()
  })
  const ethAddress = await adapter.getAddress({ wallet, bip44Params })

  const account = await adapter.getAccount(ethAddress)

  if (!quote.sellAsset) {
    throw new SwapError('quote.sellAsset is required')
  }

  const { assetNamespace } = caip19.fromCAIP19(quote.sellAsset.assetId)
  const isToken = assetNamespace === AssetNamespace.ERC20

  const balance = (() => {
    if (isToken) {
      const out = account.chainSpecific.tokens.find((x) => {
        return x.assetId === quote.sellAsset.assetId
      })?.balance
      return out
    } else {
      return account.balance
    }
  })()
  if (!balance) {
    throw new SwapError(`No balance found for ${quote.sellAsset.symbol ?? quote.sellAsset.assetId}`)
  }

  // return the erc20 token balance. No need to subtract the fee.
  if (isToken && new BigNumber(balance).gt(0)) {
    return balance
  }

  if (!quote.txData) {
    throw new SwapError('quote.txData is required to get correct fee estimate')
  }

  const feeEstimates = await adapter.getFeeData({
    to: quote.depositAddress,
    value: bnOrZero(quote.sellAmount).toString(),
    chainSpecific: {
      from: ethAddress,
      contractData: quote.txData
    }
  })

  const estimatedFee = feeEstimates[feeEstimateKey].txFee

  // (ryankk) We need to pad the fee for ETH max sends because the fee estimate is based off
  // of a minimum quote value (quote.sellAmount) and not the users full ETH balance.
  const paddedFee = new BigNumber(estimatedFee).times(ETH_FEE_ESTIMATE_PADDING)
  const sendMaxAmount = new BigNumber(balance).minus(paddedFee)

  // gte covers if sendMaxAmount is NaN
  if (!sendMaxAmount.gte(0)) {
    throw new SwapError('ETH balance is less than estimated fee')
  }

  return sendMaxAmount.toString()
}
