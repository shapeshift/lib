import { TradeQuote, GetTradeQuoteInput } from '../../../api'
import { SupportedChainIds } from '@shapeshiftoss/types'

export const getTradeQuote = (
  input: GetTradeQuoteInput
): Promise<TradeQuote<SupportedChainIds>> => {}
