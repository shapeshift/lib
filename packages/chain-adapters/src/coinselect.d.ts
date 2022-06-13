declare module 'coinselect' {
  declare function coinSelect(
    utxos: MappedUtxos[],
    outputs: bitcoin.Recipient[],
    feeRate: number
  ): { fee: number } & (
    | { inputs: MappedUtxos[]; outputs: bitcoin.Recipient[] }
    | { inputs: undefined; outputs: undefined }
  )
  export = coinSelect
}
declare module 'coinselect/split' {
  type Item = {
    script?: Uint8Array
    value?: number
    address?: string
  }
  declare function split(
    utxos: Item[],
    outputs: Item[],
    feeRate: number
  ): { fee: number } & (
    | { inputs: MappedUtxos[]; outputs: bitcoin.Recipient[] }
    | { inputs: undefined; outputs: undefined }
  )
  export = split
}
