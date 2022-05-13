import { numberToHex } from 'web3-utils'

import { ExecuteTradeInput, SwapErrorTypes, TradeResult } from '../../../api'
import { ZrxSwapError, ZrxSwapperDeps } from '../ZrxSwapper'

export async function zrxExecuteTrade(
  { adapterManager }: ZrxSwapperDeps,
  { trade, wallet }: ExecuteTradeInput<'eip155:1'>
): Promise<TradeResult> {
  const { sellAsset } = trade

  try {
    // value is 0 for erc20s
    const value = sellAsset.symbol === 'ETH' ? trade.sellAmount : '0'
    const adapter = adapterManager.byChain(sellAsset.chain)
    const bip44Params = adapter.buildBIP44Params({
      accountNumber: Number(trade.sellAssetAccountId)
    })

    const buildTxResponse = await adapter.buildSendTransaction({
      value,
      wallet,
      to: trade.depositAddress,
      chainSpecific: {
        gasPrice: numberToHex(trade.feeData?.chainSpecific?.gasPrice || 0),
        gasLimit: numberToHex(trade.feeData?.chainSpecific?.estimatedGas || 0)
      },
      bip44Params
    })

    const { txToSign } = buildTxResponse

    const txWithQuoteData = { ...txToSign, data: trade.txData ?? '' }

    if (wallet.supportsOfflineSigning()) {
      const signedTx = await adapter.signTransaction({ txToSign: txWithQuoteData, wallet })

      const txid = await adapter.broadcastTransaction(signedTx)

      return { txid }
    } else if (wallet.supportsBroadcast() && adapter.signAndBroadcastTransaction) {
      const txid = await adapter.signAndBroadcastTransaction?.({
        txToSign: txWithQuoteData,
        wallet
      })

      return { txid }
    } else {
      throw new ZrxSwapError('[zrxExecuteTrade]', {
        code: SwapErrorTypes.SIGN_AND_BROADCAST_FAILED
      })
    }
  } catch (e) {
    throw new ZrxSwapError('[zrxExecuteTrade]', { cause: e, code: SwapErrorTypes.EXECUTE_TRADE })
  }
}
