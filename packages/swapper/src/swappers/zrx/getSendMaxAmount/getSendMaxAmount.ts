import { chainAdapters, ChainTypes, SendMaxAmountInput } from '@shapeshiftoss/types'
import BigNumber from 'bignumber.js'

import { SwapError } from '../../../api'
import { bnOrZero } from '../utils/bignumber'
import { ZrxSwapperDeps } from '../ZrxSwapper'

export async function getSendMaxAmount(
  { adapterManager }: ZrxSwapperDeps,
  {
    wallet,
    quote,
    sellAssetAccountId,
    feeEstimateKey = chainAdapters.FeeDataKey.Average
  }: SendMaxAmountInput
): Promise<string> {
  const adapter = adapterManager.byChain(ChainTypes.Ethereum)
  const bip32Params = adapter.buildBIP32Params({
    accountNumber: bnOrZero(sellAssetAccountId).toNumber()
  })
  const ethAddress = await adapter.getAddress({ wallet, bip32Params })

  const account = await adapter.getAccount(ethAddress)
  const tokenId = quote.sellAsset?.tokenId

  let balance: string | undefined
  if (tokenId) {
    balance = account.chainSpecific.tokens?.find(
      (token: chainAdapters.ethereum.TokenWithBalance) =>
        token.contract.toLowerCase() === tokenId.toLowerCase()
    )?.balance
  } else {
    balance = account.balance
  }

  if (!balance) {
    throw new SwapError(`No balance found for ${tokenId ? quote.sellAsset.symbol : 'ETH'}`)
  }

  // return the erc20 token balance. No need to subtract the fee.
  if (tokenId && new BigNumber(balance).gt(0)) {
    return balance
  }

  if (!quote.txData) {
    throw new SwapError('quote.txData is required to get correct fee estimate')
  }

  const feeEstimates = await adapter.getFeeData({
    to: quote.depositAddress,
    value: quote.sellAmount,
    chainSpecific: {
      from: ethAddress,
      contractData: quote.txData
    }
  })

  const estimatedFee = feeEstimates[feeEstimateKey].txFee

  //(ryankk) We need to pad the fee because the fee estimate is based off of a smaller trade. We should
  // look at this post bounty to see if we can be more accurate.
  const paddedFee = new BigNumber(estimatedFee).times(1.2).toString()
  const sendMaxAmount = new BigNumber(balance).minus(paddedFee)

  if (sendMaxAmount.lt(0)) {
    throw new SwapError('ETH balance is less than estimated fee')
  }

  return sendMaxAmount.toString()
}
