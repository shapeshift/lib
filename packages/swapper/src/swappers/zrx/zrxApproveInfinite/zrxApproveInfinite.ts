import { ApproveInfiniteInput, SwapError, SwapErrorTypes } from '../../../api'
import { erc20Abi } from '../../utils/abi/erc20-abi'
import { grantAllowance } from '../../utils/helpers/helpers'
import { ZrxSupportedChainIds, ZrxSwapperDeps } from '../types'
import { MAX_ALLOWANCE } from '../utils/constants'

export async function zrxApproveInfinite(
  { adapter, web3 }: ZrxSwapperDeps,
  { quote, wallet }: ApproveInfiniteInput<ZrxSupportedChainIds>
) {
  try {
    const allowanceGrantRequired = await grantAllowance({
      quote: {
        ...quote,
        sellAmount: MAX_ALLOWANCE
      },
      wallet,
      adapter,
      erc20Abi,
      web3
    })

    return allowanceGrantRequired
  } catch (e) {
    if (e instanceof SwapError) throw e
    throw new SwapError('[zrxApproveInfinite]', {
      cause: e,
      code: SwapErrorTypes.APPROVE_INFINITE_FAILED
    })
  }
}
