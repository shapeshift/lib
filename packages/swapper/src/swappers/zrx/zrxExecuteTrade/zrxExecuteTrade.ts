import { ChainTypes, ExecQuoteInput, ExecQuoteOutput } from '@shapeshiftoss/types'
import { numberToHex } from 'web3-utils'

import { ExecTradeInput, ExecTradeOutput, SwapError } from '../../../api'
import { ZrxSwapperDeps } from '../ZrxSwapper'

export async function zrxExecuteTrade(
  { adapterManager }: ZrxSwapperDeps,
  { builtTrade, wallet }: ExecTradeInput<ChainTypes.Ethereum>
): Promise<ExecTradeOutput> {
  const { sellAsset } = builtTrade

  if (!sellAsset.network || !sellAsset.symbol) {
    throw new SwapError(
      'ZrxSwapper:ZrxExecuteQuote sellAssetNetwork and sellAssetSymbol are required'
    )
  }

  if (!builtTrade.sellAssetAccountId) {
    throw new SwapError('ZrxSwapper:ZrxExecuteQuote sellAssetAccountId is required')
  }

  if (!builtTrade.sellAmount) {
    throw new SwapError('ZrxSwapper:ZrxExecuteQuote sellAmount is required')
  }

  if (!builtTrade.depositAddress) {
    throw new SwapError('ZrxSwapper:ZrxExecuteQuote depositAddress is required')
  }

  // value is 0 for erc20s
  const value = sellAsset.symbol === 'ETH' ? builtTrade.sellAmount : '0'
  const adapter = adapterManager.byChain(sellAsset.chain)
  const bip44Params = adapter.buildBIP44Params({
    accountNumber: Number(builtTrade.sellAssetAccountId)
  })

  let buildTxResponse, signedTx, txid
  try {
    buildTxResponse = await adapter.buildSendTransaction({
      value,
      wallet,
      to: builtTrade.depositAddress,
      chainSpecific: {
        gasPrice: numberToHex(builtTrade.feeData?.chainSpecific?.gasPrice || 0),
        gasLimit: numberToHex(builtTrade.feeData?.chainSpecific?.estimatedGas || 0)
      },
      bip44Params
    })
  } catch (error) {
    throw new SwapError(`ZrxExecuteQuote - buildSendTransaction error: ${error}`)
  }

  const { txToSign } = buildTxResponse

  const txWithQuoteData = { ...txToSign, data: builtTrade.txData ?? '' }

  if (wallet.supportsOfflineSigning()) {
    try {
      signedTx = await adapter.signTransaction({ txToSign: txWithQuoteData, wallet })
    } catch (error) {
      throw new SwapError(`ZrxExecuteQuote - signTransaction error: ${error}`)
    }

    if (!signedTx) {
      throw new SwapError(`ZrxExecuteQuote - Signed transaction is required: ${signedTx}`)
    }

    try {
      txid = await adapter.broadcastTransaction(signedTx)
    } catch (error) {
      throw new SwapError(`ZrxExecuteQuote - broadcastTransaction error: ${error}`)
    }

    return { txid }
  } else if (wallet.supportsBroadcast() && adapter.signAndBroadcastTransaction) {
    try {
      txid = await adapter.signAndBroadcastTransaction?.({ txToSign: txWithQuoteData, wallet })
    } catch (error) {
      throw new SwapError(`ZrxExecuteQuote - signAndBroadcastTransaction error: ${error}`)
    }

    return { txid }
  } else {
    throw new SwapError('ZrxExecuteQuote - invalid HDWallet config')
  }
}
