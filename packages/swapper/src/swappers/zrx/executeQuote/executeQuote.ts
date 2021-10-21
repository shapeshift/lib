import { numberToHex } from 'web3-utils'
import { BIP32Params, ExecQuoteInput, ExecQuoteOutput } from '@shapeshiftoss/types'
import { SwapError } from '../../../api'
import { ZrxSwapperDeps } from '../ZrxSwapper'

export async function executeQuote(
  { adapterManager }: ZrxSwapperDeps,
  { quote, wallet }: ExecQuoteInput
): Promise<ExecQuoteOutput> {
  const { sellAsset } = quote

  if (!quote.success) {
    throw new SwapError('ZrxSwapper:executeQuote Cannot execute a failed quote')
  }

  if (!sellAsset.network || !sellAsset.symbol) {
    throw new SwapError('ZrxSwapper:executeQuote sellAssetNetwork and sellAssetSymbol are required')
  }

  // TODO: (ryankk) uncomment out when we implement multiple accounts for ethereum
  // if (!quote.sellAssetAccountId) {
  //   throw new SwapError('ZrxSwapper:executeQuote sellAssetAccountId is required')
  // }

  if (!quote.sellAmount) {
    throw new SwapError('ZrxSwapper:executeQuote sellAmount is required')
  }

  if (!quote.depositAddress) {
    throw new SwapError('ZrxSwapper:executeQuote depositAddress is required')
  }

  // value is 0 for erc20s
  const value = sellAsset.symbol === 'ETH' ? quote.sellAmount : '0'
  const adapter = adapterManager.byChain(sellAsset.chain)

  let buildTxResponse, signedTx, txid
  try {
    // TODO(ryankk): populate this when we implement multiple accounts for ethereum
    //
    // const bip32Params: BIP32Params = {
    //   purpose: 0,
    //   coinType: 0,
    //   accountNumber: 0
    // }
    buildTxResponse = await adapter.buildSendTransaction({
      value,
      wallet,
      to: quote.depositAddress,
      fee: numberToHex(quote.feeData?.gasPrice || 0),
      gasLimit: numberToHex(quote.feeData?.estimatedGas || 0)
      // bip32Params
    })
  } catch (error) {
    throw new SwapError(`executeQuote - buildSendTransaction error: ${error}`)
  }

  const { txToSign } = buildTxResponse

  // TODO:(ryankk) add txData type instead of string when merged into main
  const txWithQuoteData = { ...txToSign, data: quote.txData as string }

  try {
    signedTx = await adapter.signTransaction({ txToSign: txWithQuoteData, wallet })
  } catch (error) {
    throw new SwapError(`executeQuote - signTransaction error: ${error}`)
  }

  try {
    txid = await adapter.broadcastTransaction(signedTx)
  } catch (error) {
    throw new SwapError(`executeQuote - broadcastTransaction error: ${error}`)
  }

  return { txid }
}
