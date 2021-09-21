import { GetQuoteInput, Swapper, SwapperType } from '../../api'

export class ThorchainSwapper implements Swapper {
  getType() {
    return SwapperType.Thorchain
  }

  async getQuote(input: GetQuoteInput) {
    return undefined
  }
}
