import { numberToHex } from 'web3-utils'

import { ExecuteTradeInput, SwapErrorTypes, TradeResult } from '../../../api'
import { bnOrZero } from '../utils/bignumber'
import { ZrxSwapError, ZrxSwapperDeps } from '../ZrxSwapper'

export async function zrxExecuteTrade(
  { adapterManager }: ZrxSwapperDeps,
  { trade, wallet }: ExecuteTradeInput<'eip155:1'>
): Promise<TradeResult> {
  const { sellAsset } = trade
  console.log('zrxExecuteTrade')
  try {
    // value is 0 for erc20s
    const value = sellAsset.assetId === 'eip155:1/slip44:60' ? trade.sellAmount : '0'
    console.log('wtf1', sellAsset)
    const adapter = await adapterManager.byChainId(sellAsset.chainId)
    console.log('wtf2')
    const bip44Params = adapter.buildBIP44Params({
      accountNumber: bnOrZero(trade.sellAssetAccountId).toNumber()
    })

    console.log('about to build tx with', value, trade)
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

    console.log('first')
    if (wallet.supportsOfflineSigning()) {
      const signedTx = await adapter.signTransaction({ txToSign: txWithQuoteData, wallet })

      const txid = await adapter.broadcastTransaction(signedTx)

      return { txid }
    } else if (wallet.supportsBroadcast() && adapter.signAndBroadcastTransaction) {
      console.log('sign and broadcast')
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
