import BigNumber from 'bignumber.js'
import { ChainTypes } from '@shapeshiftoss/types'
import { ChainAdapterManager } from '@shapeshiftoss/chain-adapters'
import { SendMaxAmountInput } from '../ZrxSwapper'
import { SwapError } from '../../../api'

// TODO:(ryankk) move type into types package
type SendMaxAmountDeps = {
  adapterManager: ChainAdapterManager
}

export async function getSendMaxAmount(
  { adapterManager }: SendMaxAmountDeps,
  { wallet, quote, sellAssetAccountId, feeEstimateKey }: SendMaxAmountInput
): Promise<string> {
  const adapter = adapterManager.byChain(ChainTypes.Ethereum)
  const bip32Params = adapter.buildBIP32Params({ accountNumber: Number(sellAssetAccountId) })
  const ethAddress = await adapter.getAddress({ wallet, bip32Params })

  const account = await adapter.getAccount(ethAddress)
  const tokenId = quote.sellAsset?.tokenId

  let balance: string | undefined
  if (quote.sellAsset.tokenId) {
    balance = account.chainSpecific.tokens?.find(
      (token) => token.contract.toLowerCase() === tokenId?.toLowerCase()
    )?.balance
  } else {
    balance = account.balance
  }

  if (!balance) {
    throw new Error(`No balance found for ${quote.sellAsset.symbol}`)
  }

  let feeEstimates
  try {
    feeEstimates = await adapter.getFeeData({
      to: quote.depositAddress,
      from: ethAddress,
      value: balance,
      contractAddress: tokenId
    })
  } catch (err) {
    throw new Error(`getSendMaxAmount:getFeeData - ${err}`)
  }

  const estimatedFee = feeEstimates[feeEstimateKey].chainSpecific.feePerTx
  const sendMaxAmount = new BigNumber(balance).minus(estimatedFee)

  if (!sendMaxAmount.gt(0)) {
    throw new Error('ETH balance is less than estimated fee')
  }

  return sendMaxAmount.toString()
}
