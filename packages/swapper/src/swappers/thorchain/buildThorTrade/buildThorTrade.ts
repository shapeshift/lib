import { ChainId } from '@shapeshiftoss/caip'
import { ethereum } from '@shapeshiftoss/chain-adapters'
import { KnownChainIds } from '@shapeshiftoss/types'

import { BuildTradeInput, SwapError, SwapErrorTypes, TradeQuote } from '../../../api'
import { DEFAULT_SLIPPAGE } from '../../utils/constants'
import { getThorTradeQuote } from '../getThorTradeQuote/getTradeQuote'
import { ThorchainSwapperDeps, ThorTrade } from '../types'
import { makeTradeTx } from '../utils/ethereum/makeTradeTx'
export const buildTrade = async ({
  deps,
  input
}: {
  deps: ThorchainSwapperDeps
  input: BuildTradeInput
}): Promise<ThorTrade<ChainId>> => {
  const {
    buyAsset,
    sellAsset,
    sellAssetAccountNumber,
    sellAmount,
    wallet,
    slippage: slippageTolerance = DEFAULT_SLIPPAGE,
    receiveAddress: destinationAddress
  } = input

  const quote = await getThorTradeQuote({ deps, input })
  const sellAdapter = deps.adapterManager.get(sellAsset.chainId)

  if (!sellAdapter)
    throw new SwapError('[executeTrade]: unsupported sell asset', {
      code: SwapErrorTypes.BUILD_TRADE_FAILED,
      fn: 'executeTrade',
      details: { sellAsset }
    })
  const sellAssetBip44Params = sellAdapter.buildBIP44Params({
    accountNumber: sellAssetAccountNumber
  })

  console.log('quote is', quote)
  if (sellAsset.chainId === 'eip155:1') {
    const ethTradeTx = await makeTradeTx({
      wallet,
      slippageTolerance,
      bip44Params: sellAssetBip44Params,
      sellAsset,
      buyAsset,
      adapter: sellAdapter as unknown as ethereum.ChainAdapter,
      sellAmount,
      destinationAddress,
      deps,
      gasPrice:
        (quote as TradeQuote<KnownChainIds.EthereumMainnet>).feeData.chainSpecific?.gasPrice ?? '0',
      gasLimit:
        (quote as TradeQuote<KnownChainIds.EthereumMainnet>).feeData.chainSpecific?.estimatedGas ??
        '0',
      tradeFee: quote.feeData.tradeFee
    })
    console.log('ethTradeTx', ethTradeTx)
    return {
      chainId: 'eip155:1',
      ...quote,
      receiveAddress: destinationAddress,
      txData: ethTradeTx.txToSign
    } as ThorTrade<'eip155:1'>
  } else {
    throw new SwapError('[executeTrade]: unsupported sell asset', {
      code: SwapErrorTypes.BUILD_TRADE_FAILED,
      fn: 'executeTrade',
      details: { sellAsset }
    })
  }
}
