export enum SwapperType {
  Zrx = '0x',
  ThorChain = 'ThorChain'
}

export interface Swapper {
  /** Returns the swapper type */
  getType(): SwapperType
}
