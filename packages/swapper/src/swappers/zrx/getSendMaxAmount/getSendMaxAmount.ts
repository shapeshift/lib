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

  const { balance } = await adapter.getAccount(ethAddress)

  // TODO:(ryankk) make sure these values passed into 'getFeeData' are correct
  const feeEstimates = await adapter.getFeeData({
    to: quote.depositAddress,
    from: ethAddress,
    value: balance,
    contractAddress: quote.sellAsset.tokenId
  })

  const estimatedFee = feeEstimates[feeEstimateKey].chainSpecific.feePerTx

  const sendMaxAmount = new BigNumber(balance).minus(estimatedFee)

  if (!sendMaxAmount.gt(0)) {
    throw new SwapError('ETH balance is less than estimated fee')
  }

  return sendMaxAmount.toString()
}
