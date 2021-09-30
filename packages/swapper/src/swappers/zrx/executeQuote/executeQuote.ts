import { ExecQuoteInput, ExecQuoteOutput, SwapError } from '../../../api'
import { ZrxSwapperDeps } from '../ZrxSwapper'

export async function executeQuote({ adapterManager }: ZrxSwapperDeps, { quote, wallet }: ExecQuoteInput): Promise<ExecQuoteOutput> {
  const { sellAsset } = quote

  if (!quote.success) {
    throw new SwapError('ZrxSwapper:executeQuote Cannot execute a failed quote')
  }

  if (!sellAsset.network || !sellAsset.symbol) {
    throw new SwapError('ZrxSwapper:executeQuote sellAssetNetwork and sellAssetSymbol are required')
  }

  if (!quote.sellAssetAccountId) {
    throw new SwapError('ZrxSwapper:executeQuote sellAssetAccountId is required')
  }

  if (!quote.sellAmount) {
    throw new SwapError('ZrxSwapper:executeQuote sellAmount is required')
  }

  return { txid: '', approvalTxid: '' }
}
