/* eslint-disable no-console */
import * as unchained from '@shapeshiftoss/unchained-client'
import coinSelect from 'coinselect'
import split from 'coinselect/split'

import { bitcoin } from '../types'

export type MappedUtxos = Omit<unchained.bitcoin.Utxo, 'value'> & { value: number }

const handleStandardTx = ({
  utxos,
  value,
  to,
  satoshiPerByte,
  sendMax
}: {
  utxos: unchained.bitcoin.Utxo[]
  to: string
  value: string
  satoshiPerByte: string
  opReturnData?: string
  sendMax: boolean
}) => {
  const mappedUtxos: MappedUtxos[] = utxos.map((x) => ({ ...x, value: Number(x.value) }))
  if (sendMax) {
    return split(mappedUtxos, [{ address: to }], Number(satoshiPerByte))
  } else {
    return coinSelect<MappedUtxos, bitcoin.Recipient>(
      mappedUtxos,
      [{ value: Number(value), address: to }],
      Number(satoshiPerByte)
    )
  }
}

// TODO this will be implemented in another PR to keep concerns separated and make review easier
const handleOpReturnTx = ({
  utxos,
  value,
  to,
  satoshiPerByte,
  opReturnData,
  sendMax
}: {
  utxos: unchained.bitcoin.Utxo[]
  to: string
  value: string
  satoshiPerByte: string
  opReturnData?: string
  sendMax: boolean
}) => {
  console.info('handleOpReturnTx', {
    utxos,
    value,
    to,
    satoshiPerByte,
    opReturnData,
    sendMax
  })
  throw new Error('not implemented')
}

export const utxoSelect = (input: {
  utxos: unchained.bitcoin.Utxo[]
  to: string
  value: string
  satoshiPerByte: string
  opReturnData?: string
  sendMax: boolean
}) => {
  if (input.opReturnData) return handleOpReturnTx(input)
  else return handleStandardTx(input)
}
