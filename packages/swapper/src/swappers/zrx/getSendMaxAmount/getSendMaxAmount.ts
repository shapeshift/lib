import { chainAdapters, ChainTypes, SendMaxAmountInput } from '@shapeshiftoss/types'
import BigNumber from 'bignumber.js'

import { SwapError } from '../../../api'
import { ZrxSwapperDeps } from '../ZrxSwapper'
import { bnOrZero } from '../utils/bignumber'

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

  const feeEstimates = await adapter.getFeeData({
    to: quote.depositAddress,
    value: balance,
    chainSpecific: {
      from: ethAddress,
      contractAddress: tokenId
    }
  })

  const estimatedFee = feeEstimates[feeEstimateKey].txFee

  const sendMaxAmount = new BigNumber(balance).minus(estimatedFee)

  if (sendMaxAmount.lt(0)) {
    throw new SwapError('ETH balance is less than estimated fee')
  }

  return sendMaxAmount.toString()
}
