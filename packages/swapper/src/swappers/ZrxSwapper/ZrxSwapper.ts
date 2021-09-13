import { SwapperType } from '..'
import { Swapper } from '../api'

export class ZrxSwapper implements Swapper {
  getType() {
    return SwapperType.Zrx
  }
}
