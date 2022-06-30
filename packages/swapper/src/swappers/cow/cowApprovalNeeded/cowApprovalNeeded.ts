import { fromAssetId } from '@shapeshiftoss/caip'

import { ApprovalNeededInput, ApprovalNeededOutput, SwapError, SwapErrorTypes } from '../../../api'
import { erc20AllowanceAbi } from '../../utils/abi/erc20Allowance-abi'
import { bnOrZero } from '../../utils/bignumber'
import { getERC20Allowance } from '../../utils/helpers/helpers'
import { CowSwapperDeps } from '../CowSwapper'

const COW_SWAP_VAULT_RELAYER_ADDRESS = '0xc92e8bdf79f0507f65a392b0ab4667716bfe0110'

export async function cowApprovalNeeded(
  { adapter, web3 }: CowSwapperDeps,
  { quote, wallet }: ApprovalNeededInput<'eip155:1'>
): Promise<ApprovalNeededOutput> {
  const { sellAsset } = quote

  const { assetReference: sellAssetErc20Address, assetNamespace } = fromAssetId(sellAsset.assetId)

  try {
    if (assetNamespace !== 'erc20') {
      throw new SwapError('[cowApprovalNeeded] - unsupported asset namespace', {
        code: SwapErrorTypes.UNSUPPORTED_NAMESPACE,
        details: { assetNamespace }
      })
    }

    const receiveAddress = await adapter.getAddress({ wallet })

    const allowanceResult = await getERC20Allowance({
      web3,
      erc20AllowanceAbi,
      sellAssetErc20Address,
      spenderAddress: COW_SWAP_VAULT_RELAYER_ADDRESS,
      ownerAddress: receiveAddress
    })

    const allowanceOnChain = bnOrZero(allowanceResult)

    return {
      approvalNeeded: allowanceOnChain.lte(bnOrZero(quote.sellAmount))
    }
  } catch (e) {
    if (e instanceof SwapError) throw e
    throw new SwapError('[cowApprovalNeeded]', {
      cause: e,
      code: SwapErrorTypes.CHECK_APPROVAL_FAILED
    })
  }
}
