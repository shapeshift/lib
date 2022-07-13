import { ethereum } from '@shapeshiftoss/chain-adapters'
import { KnownChainIds } from '@shapeshiftoss/types'

import { ApproveInfiniteInput, SwapError, SwapErrorTypes } from '../../../api'
import { erc20Abi } from '../../utils/abi/erc20-abi'
import { grantAllowance, isSwapError } from '../../utils/helpers/helpers'
import { ThorchainSwapperDeps } from '../types'
import { MAX_ALLOWANCE } from '../utils/constants'

export const thorTradeApproveInfinite = async ({
  deps,
  input
}: {
  deps: ThorchainSwapperDeps
  input: ApproveInfiniteInput<KnownChainIds.EthereumMainnet>
}): Promise<string> => {
  try {
    const { adapterManager, web3 } = deps
    const { quote, wallet } = input

    const sellAssetChainId = quote.sellAsset.chainId
    const adapter = adapterManager.get(KnownChainIds.EthereumMainnet) as unknown as
      | ethereum.ChainAdapter
      | undefined

    if (!adapter)
      throw new SwapError(
        `[thorTradeApproveInfinite] - No chain adapter found for ${sellAssetChainId}.`,
        {
          code: SwapErrorTypes.UNSUPPORTED_CHAIN,
          details: { sellAssetChainId }
        }
      )

    const allowanceGrantRequired = await grantAllowance<KnownChainIds.EthereumMainnet>({
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
    if (isSwapError(e)) throw e
    throw new SwapError('[zrxApproveInfinite]', {
      cause: e,
      code: SwapErrorTypes.APPROVE_INFINITE_FAILED
    })
  }
}
