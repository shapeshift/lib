import { AxiosResponse } from 'axios'
import { ApproveInfiniteInput, QuoteResponse } from '@shapeshiftoss/types'
import { ZrxSwapperDeps } from '../ZrxSwapper'
import {
  DEFAULT_ETH_PATH,
  DEFAULT_SLIPPAGE,
  AFFILIATE_ADDRESS,
  MAX_ALLOWANCE
} from '../utils/constants'
import { zrxService } from '../utils/zrxService'
import { grantAllowance } from '../utils/helpers/helpers'
import { erc20Abi } from '../utils/abi/erc20-abi'

export async function approveInfinite(
  { adapterManager, web3 }: ZrxSwapperDeps,
  { quote, wallet }: ApproveInfiniteInput
) {
  const adapter = adapterManager.byChain(quote.buyAsset.chain)
  const receiveAddress = await adapter.getAddress({ wallet, path: DEFAULT_ETH_PATH })

  /**
   * /swap/v1/quote
   * params: {
   *   sellToken: contract address (or symbol) of token to sell
   *   buyToken: contractAddress (or symbol) of token to buy
   *   sellAmount?: integer string value of the smallest increment of the sell token
   *   buyAmount?: integer string value of the smallest incremtent of the buy token
   * }
   */
  const quoteResponse: AxiosResponse<QuoteResponse> = await zrxService.get<QuoteResponse>(
    '/swap/v1/quote',
    {
      params: {
        buyToken: 'ETH',
        sellToken: quote.sellAsset.tokenId || quote.sellAsset.symbol || quote.sellAsset.network,
        buyAmount: '100000000000000000', // A valid buy amount - 0.1 ETH
        takerAddress: receiveAddress,
        slippagePercentage: DEFAULT_SLIPPAGE,
        skipValidation: true,
        affiliateAddress: AFFILIATE_ADDRESS
      }
    }
  )
  const { data } = quoteResponse

  return grantAllowance({
    quote: {
      ...quote,
      allowanceContract: data.allowanceTarget as string,
      sellAmount: MAX_ALLOWANCE
    },
    wallet,
    adapter,
    erc20Abi,
    web3
  })
}
