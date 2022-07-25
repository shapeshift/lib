import { ChainId } from '@shapeshiftoss/caip'
import { bitcoin, ethereum } from '@shapeshiftoss/chain-adapters'
import { KnownChainIds } from '@shapeshiftoss/types'

import { BuildTradeInput, SwapError, SwapErrorTypes, TradeQuote } from '../../../api'
import { DEFAULT_SLIPPAGE } from '../../utils/constants'
import { getThorTradeQuote } from '../getThorTradeQuote/getTradeQuote'
import { ThorchainSwapperDeps, ThorTrade } from '../types'
import { getThorTxInfo as getBtcThorTxInfo } from '../utils/bitcoin/utils/getThorTxData'
import { makeTradeTx } from '../utils/ethereum/makeTradeTx'
import { getBtcTxFees } from '../utils/txFeeHelpers/btcTxFees/getBtcTxFees'

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
    throw new SwapError('[buildTrade]: unsupported sell asset', {
      code: SwapErrorTypes.BUILD_TRADE_FAILED,
      fn: 'buildTrade',
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

    return {
      chainId: 'eip155:1',
      ...quote,
      receiveAddress: destinationAddress,
      txData: ethTradeTx.txToSign
    } as ThorTrade<'eip155:1'> // Do we need these casted?
  } else if (sellAsset.chainId === 'bip122:000000000019d6689c085ae165831e93') {
    if (input.chainId !== KnownChainIds.BitcoinMainnet)
      throw new SwapError('[buildTrade]: bad chain id', {
        code: SwapErrorTypes.BUILD_TRADE_FAILED,
        fn: 'executeTrade',
        details: { chainId: input.chainId }
      })
    const { vault, opReturnData, pubkey } = await getBtcThorTxInfo({
      deps,
      sellAsset,
      buyAsset,
      sellAmount,
      slippageTolerance: DEFAULT_SLIPPAGE,
      destinationAddress,
      wallet,
      bip44Params: sellAssetBip44Params,
      accountType: input.accountType
    })

    const feeData = await getBtcTxFees({
      deps,
      buyAsset,
      sellAmount,
      vault,
      opReturnData,
      pubkey,
      adapterManager: deps.adapterManager
    })

    console.log('opReturnData is', opReturnData)

    const buildTxResponse = await (
      sellAdapter as unknown as bitcoin.ChainAdapter
    ).buildSendTransaction({
      value: sellAmount,
      wallet,
      to: vault,
      chainSpecific: {
        accountType: input.accountType,
        satoshiPerByte: feeData.chainSpecific.satsPerByte,
        opReturnData
      }
    })

    return {
      chainId: 'bip122:000000000019d6689c085ae165831e93',
      ...quote,
      receiveAddress: destinationAddress,
      txData: buildTxResponse.txToSign
    } as ThorTrade<'bip122:000000000019d6689c085ae165831e93'> // Do we need these casted?
  } else {
    throw new Error()
  }
}
