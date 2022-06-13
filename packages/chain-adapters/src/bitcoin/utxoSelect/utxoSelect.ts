import * as unchained from '@shapeshiftoss/unchained-client'
import coinSelect from 'coinselect'
import split from 'coinselect/split'

import { bitcoin } from '../../types'

export type MappedUtxos = Omit<unchained.bitcoin.Utxo, 'value'> & { value: number }

const standardTx = ({
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
  sendMax: boolean
}) => {
  const mappedUtxos: MappedUtxos[] = utxos.map((x) => ({ ...x, value: Number(x.value) }))
  if (sendMax) {
    return split(mappedUtxos, [{ address: to }], Number(satoshiPerByte))
  } else {
    console.log('doing standard tx')
    return coinSelect<MappedUtxos, bitcoin.Recipient>(
      mappedUtxos,
      [{ value: Number(value), address: to }],
      Number(satoshiPerByte)
    )
  }
}

const opReturnTx = ({
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
  const mappedUtxos: MappedUtxos[] = utxos.map((x) => ({ ...x, value: Number(x.value) }))

  const opReturnOutput = {
    value: 0,
    script: new TextEncoder().encode(opReturnData)
  }

  // TODO strip off the op_return output before returning
  if (sendMax) {
    return split(mappedUtxos, [{ address: to }, opReturnOutput], Number(satoshiPerByte))
  } else {
    return coinSelect<MappedUtxos, bitcoin.Recipient>(
      mappedUtxos,
      [{ value: Number(value), address: to }, opReturnOutput],
      Number(satoshiPerByte)
    )
  }
}

/**
 * Returns necessary utxo inputs & outputs for a desired tx at a given fee
 * Handles standard "send" txs and "send" txs that will have an additional OP_RETURN output
 *
 * NOTE: opReturnData is never attached as an "output" here
 * opReturnData is ultimately attached during signing
 * its used here to determine the correct fee for the tx with the assumption that it will be added upon signing
 */
export const utxoSelect = (input: {
  utxos: unchained.bitcoin.Utxo[]
  to: string
  value: string
  satoshiPerByte: string
  opReturnData?: string
  sendMax: boolean
}) => {
  if (input.opReturnData) return opReturnTx(input)
  else return standardTx(input)
}
