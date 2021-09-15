import { Swapper, SwapperType } from '..'

export class SwapperManger<T extends SwapperType> {
  public swappers: Map<T, () => Swapper>

  constructor() {
    this.swappers = new Map()
  }

  addSwapper(swapperType: T, factory: () => Swapper) {
    this.swappers.set(swapperType, factory)
  }

  bySwapper(swapperType: T) {
    return this.swappers.get(swapperType)
  }
}
