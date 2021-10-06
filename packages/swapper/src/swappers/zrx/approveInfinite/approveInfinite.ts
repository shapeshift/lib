import { AxiosResponse } from 'axios'
import { ApproveInfiniteInput, QuoteResponse } from '@shapeshiftoss/types'
import { ZrxSwapperDeps } from '../ZrxSwapper'
import { DEFAULT_ETH_PATH, DEFAULT_SLIPPAGE, AFFILIATE_ADDRESS } from '../utils/constants'
import { zrxService } from '../utils/zrxService'

type GrantAllowanceArgs = {
  quote: Quote
  wallet: HDWallet
  adapter: ChainAdapter
  erc20abi: AbiItem[]
  web3: Web3
}

const grantAllowance = async ({ quote, wallet, adapter, erc20abi, web3 }: GrantAllowanceArgs) => {
  const erc20Contract = new web3.eth.Contract(erc20abi, quote.sellAsset.contractAddress)
  const approveTx = erc20Contract.methods
    .approve(quote.allowanceContract, quote.sellAmount)
    .encodeABI()

  const value = quote.sellAsset.symbol === 'ETH' ? numberToHex(quote.sellAmount || 0) : '0x0'
  const { txToSign } = await adapter.buildSendTransaction({
    value,
    wallet,
    to: quote.depositAddress,
    path: DEFAULT_ETH_PATH,
    fee: numberToHex(quote.feeData?.gasPrice || 0),
    limit: numberToHex(quote.feeData?.estimatedGas || 0)
  })

  const signedTx = await adapter.signTransaction({ txToSign, wallet })

  const txid = await adapter.broadcastTransaction(signedTx)
}

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
}
