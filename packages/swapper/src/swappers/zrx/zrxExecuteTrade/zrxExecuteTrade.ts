import { numberToHex } from 'web3-utils'

import { ExecuteTradeInput, SwapErrorTypes, TradeResult } from '../../../api'
import { ZrxSwapperDeps, ZrxSwapError } from '../ZrxSwapper'

export async function zrxExecuteTrade(
  { adapterManager }: ZrxSwapperDeps,
  { trade, wallet }: ExecuteTradeInput<'eip155:1'>
): Promise<TradeResult> {
  const { sellAsset } = trade

  // value is 0 for erc20s
  const value = sellAsset.symbol === 'ETH' ? trade.sellAmount : '0'
  const adapter = adapterManager.byChain(sellAsset.chain)
  const bip44Params = adapter.buildBIP44Params({
    accountNumber: Number(trade.sellAssetAccountId)
  })

  let buildTxResponse, signedTx, txid
  try {
    buildTxResponse = await adapter.buildSendTransaction({
      value,
      wallet,
      to: trade.depositAddress,
      chainSpecific: {
        gasPrice: numberToHex(trade.feeData?.chainSpecific?.gasPrice || 0),
        gasLimit: numberToHex(trade.feeData?.chainSpecific?.estimatedGas || 0)
      },
      bip44Params
    })
  } catch (error) {
    throw new ZrxSwapError(SwapErrorTypes.BUILDING_TRANSACTION_FAILED, { cause: error })
  }

  const { txToSign } = buildTxResponse

  const txWithQuoteData = { ...txToSign, data: trade.txData ?? '' }

  if (wallet.supportsOfflineSigning()) {
    try {
      signedTx = await adapter.signTransaction({ txToSign: txWithQuoteData, wallet })
    } catch (error) {
      throw new ZrxSwapError(SwapErrorTypes.SIGNING_FAILED, { cause: error })
    }

    // TODO(ryankk): should we add a cause?
    if (!signedTx) {
      throw new ZrxSwapError(SwapErrorTypes.SIGNING_REQUIRED, { details: signedTx })
    }

    try {
      txid = await adapter.broadcastTransaction(signedTx)
    } catch (error) {
      throw new ZrxSwapError(SwapErrorTypes.BROADCAST_FAILED, { cause: error })
    }

    return { txid }
  } else if (wallet.supportsBroadcast() && adapter.signAndBroadcastTransaction) {
    try {
      txid = await adapter.signAndBroadcastTransaction?.({ txToSign: txWithQuoteData, wallet })
    } catch (error) {
      throw new ZrxSwapError(SwapErrorTypes.SIGN_AND_BROADCAST_FAILED, { cause: error })
    }

    return { txid }
  } else {
    // TODO: should we send something specific from the wallet in this case?
    throw new ZrxSwapError(SwapErrorTypes.HDWALLET_INVALID_CONFIG, { details: wallet })
  }
}
