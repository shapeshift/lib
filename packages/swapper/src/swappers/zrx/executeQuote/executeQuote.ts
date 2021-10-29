import { ChainTypes, ExecQuoteInput, ExecQuoteOutput, SwapperType } from '@shapeshiftoss/types'
import { numberToHex } from 'web3-utils'

import { SwapError } from '../../../api'
import { ZrxSwapperDeps } from '../ZrxSwapper'

export async function executeQuote(
  { adapterManager }: ZrxSwapperDeps,
  { quote, wallet }: ExecQuoteInput<SwapperType.Zrx>
): Promise<ExecQuoteOutput> {
  const { sellAsset } = quote

  if (!quote.success) {
    throw new SwapError('ZrxSwapper:executeQuote Cannot execute a failed quote')
  }

  if (!sellAsset.network || !sellAsset.symbol) {
    throw new SwapError('ZrxSwapper:executeQuote sellAssetNetwork and sellAssetSymbol are required')
  }

  if (sellAsset.chain !== ChainTypes.Ethereum) {
    throw new Error('ZrxSwapper:executeQuote only ethereum sellAssets are supported')
  }

  if (!quote.sellAssetAccountId) {
    throw new SwapError('ZrxSwapper:executeQuote sellAssetAccountId is required')
  }

  if (!quote.sellAmount) {
    throw new SwapError('ZrxSwapper:executeQuote sellAmount is required')
  }

  if (!quote.depositAddress) {
    throw new SwapError('ZrxSwapper:executeQuote depositAddress is required')
  }

  // value is 0 for erc20s
  const value = sellAsset.symbol === 'ETH' ? quote.sellAmount : '0'
  const adapter = adapterManager.byChain(sellAsset.chain)
  const bip32Params = adapter.buildBIP32Params({
    accountNumber: Number(quote.sellAssetAccountId)
  })

  const buildTxResponse = await adapter.buildSendTransaction({
    value,
    wallet,
    to: quote.depositAddress,
    fee: numberToHex(quote.feeData?.chainSpecific?.gasPrice || 0),
    gasLimit: numberToHex(quote.feeData?.chainSpecific?.estimatedGas || 0),
    bip32Params
  })

  const { txToSign } = buildTxResponse

  const txWithQuoteData = { ...txToSign, data: quote.txData ?? '' }

  const signedTx = await adapter.signTransaction({ txToSign: txWithQuoteData, wallet })

  if (!signedTx) throw new SwapError(`executeQuote - Signed transaction is required: ${signedTx}`)

  const txid = await adapter.broadcastTransaction(signedTx)

  return { txid }
}
