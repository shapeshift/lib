import { SwapperType } from '..'
import { Swapper } from '../../api'

export class ThorchainSwapper implements Swapper {
  getType() {
    return SwapperType.ThorChain
  }
}
