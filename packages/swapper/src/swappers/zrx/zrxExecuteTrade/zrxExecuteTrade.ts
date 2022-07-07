import { numberToHex } from 'web3-utils'

import { ExecuteTradeInput, SwapError, SwapErrorTypes, TradeResult } from '../../../api'
import { ZrxSupportedChainIds, ZrxSwapperDeps, ZrxTrade } from '../types'
import { isNativeEvmAsset } from '../utils/helpers/helpers'

export async function zrxExecuteTrade(
  { adapter }: ZrxSwapperDeps,
  { trade, wallet }: ExecuteTradeInput<ZrxSupportedChainIds>
): Promise<TradeResult> {
  const zrxTrade = trade as ZrxTrade
  const { sellAsset } = zrxTrade
  try {
    // value is 0 for erc20s
    const value = isNativeEvmAsset(sellAsset.assetId) ? trade.sellAmount : '0'
    const bip44Params = adapter.buildBIP44Params({
      accountNumber: trade.sellAssetAccountNumber
    })

    const buildTxResponse = await adapter.buildSendTransaction({
      value,
      wallet,
      to: zrxTrade.depositAddress,
      chainSpecific: {
        gasPrice: numberToHex(trade.feeData?.chainSpecific?.gasPrice || 0),
        gasLimit: numberToHex(trade.feeData?.chainSpecific?.estimatedGas || 0)
      },
      bip44Params
    })

    const { txToSign } = buildTxResponse

    const txWithQuoteData = { ...txToSign, data: zrxTrade.txData ?? '' }

    if (wallet.supportsOfflineSigning()) {
      const signedTx = await adapter.signTransaction({ txToSign: txWithQuoteData, wallet })

      const txid = await adapter.broadcastTransaction(signedTx)

      return { tradeId: txid }
    } else if (wallet.supportsBroadcast() && adapter.signAndBroadcastTransaction) {
      const txid = await adapter.signAndBroadcastTransaction?.({
        txToSign: txWithQuoteData,
        wallet
      })

      return { tradeId: txid }
    } else {
      throw new SwapError('[zrxExecuteTrade]', {
        code: SwapErrorTypes.SIGN_AND_BROADCAST_FAILED
      })
    }
  } catch (e) {
    if (e instanceof SwapError) throw e
    throw new SwapError('[zrxExecuteTrade]', {
      cause: e,
      code: SwapErrorTypes.EXECUTE_TRADE_FAILED
    })
  }
}
