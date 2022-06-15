import { ApproveInfiniteInput, SwapError, SwapErrorTypes } from '../../../api'
import { erc20Abi } from '../../utils/abi/erc20-abi'
import { grantAllowance } from '../../utils/helpers/helpers'
import { ThorchainSwapperDeps } from '../types'
import { MAX_ALLOWANCE } from '../utils/constants'

export const thorTradeApproveInfinite = async (
  { adapterManager, web3 }: ThorchainSwapperDeps,
  { quote, wallet }: ApproveInfiniteInput<'eip155:1'>
) => {
  try {
    const sellAssetChainId = quote.sellAsset.chainId
    const adapter = adapterManager.get(sellAssetChainId)
    if (!adapter)
      throw new SwapError(
        `[thorTradeApproveInfinite] - No chain adapter found for ${sellAssetChainId}.`,
        {
          code: SwapErrorTypes.UNSUPPORTED_CHAIN,
          details: { sellAssetChainId }
        }
      )

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
    throw new SwapError('[ZrxApproveInfinite]', {
      cause: e,
      code: SwapErrorTypes.APPROVE_INFINITE_FAILED
    })
  }
}
