import { ChainId } from '@shapeshiftoss/caip'
import { ChainAdapter } from '@shapeshiftoss/chain-adapters'
import { ChainTypes } from '@shapeshiftoss/types'

import { ApproveInfiniteInput } from '../../../api'
import { erc20Abi } from '../utils/abi/erc20-abi'
import { MAX_ALLOWANCE } from '../utils/constants'
import { grantAllowance } from '../utils/helpers/helpers'
import { ZrxSwapperDeps } from '../ZrxSwapper'

export async function ZrxApproveInfinite(
  { adapterManager, web3 }: ZrxSwapperDeps,
  { quote, wallet }: ApproveInfiniteInput<ChainId>
) {
  // This will change when byChain is converted to byChainId
  const adapter: ChainAdapter<ChainId> = adapterManager.byChain(ChainTypes.Ethereum)
  const allowanceGrantRequired = await grantAllowance({
    quote: {
      ...quote,
      allowanceContract: quote.allowanceContract,
      sellAmount: MAX_ALLOWANCE
    },
    wallet,
    adapter,
    erc20Abi,
    web3
  })

  return allowanceGrantRequired
}
