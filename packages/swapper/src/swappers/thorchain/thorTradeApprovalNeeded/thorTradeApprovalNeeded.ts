import { ApprovalNeededOutput, ApprovalNeededInput } from '../../../api'
import { ThorchainSwapperDeps } from '../types'
import { fromAssetId, getFeeAssetIdFromAssetId } from '@shapeshiftoss/caip'
import { SwapError, SwapErrorTypes } from '../../../api'
import { getERC20Allowance } from '../../utils/helpers/helpers'
import { bnOrZero } from '../../utils/bignumber'

export const thorTradeApprovalNeeded = async ({
  deps,
  input
}: {
  deps: ThorchainSwapperDeps
  input: ApprovalNeededInput<'eip155:1'>
}): Promise<ApprovalNeededOutput> => {
  const { quote } = input
  const { sellAsset } = quote
  const { adapter, wallet } = deps

  const { assetReference: sellAssetErc20Address } = fromAssetId(sellAsset.assetId)

  try {
    // TODO: fix this to be expandable for multiple ETH networks
    if (sellAsset.chainId !== 'eip155:1') {
      throw new SwapError('[thorTradeApprovalNeeded] - sellAsset chainId is not supported', {
        code: SwapErrorTypes.UNSUPPORTED_CHAIN,
        details: { chainId: sellAsset.chainId }
      })
    }

    // No approval needed for selling a fee asset
    if (sellAsset.assetId === getFeeAssetIdFromAssetId(sellAsset.assetId)) {
      return { approvalNeeded: false }
    }

    const accountNumber = quote.sellAssetAccountNumber

    const bip44Params = adapter.buildBIP44Params({ accountNumber })
    const receiveAddress = await adapter.getAddress({ wallet, bip44Params })

    if (!quote.allowanceContract) {
      throw new SwapError('[thorTradeApprovalNeeded] - allowanceTarget is required', {
        code: SwapErrorTypes.VALIDATION_FAILED,
        details: { chainId: sellAsset.chainId }
      })
    }

    const allowanceResult = await getERC20Allowance({
      web3,
      erc20AllowanceAbi,
      sellAssetErc20Address,
      spenderAddress: quote.allowanceContract,
      ownerAddress: receiveAddress
    })
    const allowanceOnChain = bnOrZero(allowanceResult)

    if (!quote.feeData.chainSpecific?.gasPrice)
      throw new SwapError('[thorTradeApprovalNeeded] - no gas price with quote', {
        code: SwapErrorTypes.RESPONSE_ERROR,
        details: { feeData: quote.feeData }
      })
    return {
      approvalNeeded: allowanceOnChain.lte(bnOrZero(quote.sellAmount))
    }
  } catch (e) {
    if (e instanceof SwapError) throw e
    throw new SwapError('[thorTradeApprovalNeeded]', {
      cause: e,
      code: SwapErrorTypes.CHECK_APPROVAL_FAILED
    })
  }
}
