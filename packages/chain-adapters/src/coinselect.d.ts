declare module 'coinselect' {
  type Item = {
    script?: Uint8Array
    value: number
  }
  declare function coinSelect<T extends Item, U extends Item>(
    utxos: T[],
    outputs: U[],
    feeRate: number
  ): { fee: number } & ({ inputs: T[]; outputs: U[] } | { inputs: undefined; outputs: undefined })
  export = coinSelect
}
declare module 'coinselect/split'
