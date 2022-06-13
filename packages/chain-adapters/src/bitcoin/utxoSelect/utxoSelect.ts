import * as unchained from '@shapeshiftoss/unchained-client'
import coinSelect from 'coinselect'
import split from 'coinselect/split'

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
  const mappedUtxos = utxos.map((x) => ({ ...x, value: Number(x.value) }))
  if (sendMax) {
    return split(mappedUtxos, [{ address: to }], Number(satoshiPerByte))
  } else {
    return coinSelect(mappedUtxos, [{ value: Number(value), address: to }], Number(satoshiPerByte))
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
  const mappedUtxos = utxos.map((x) => ({ ...x, value: Number(x.value) }))

  // value set to 1 sat because of bug in coinselect
  // where split doesnt work with 0 values for script
  const opReturnOutput = {
    value: 1,
    script: new TextEncoder().encode(opReturnData)
  }

  if (sendMax) {
    const result = split(mappedUtxos, [{ address: to }, opReturnOutput], Number(satoshiPerByte))
    const filteredOutputs = result.outputs?.filter((output) => !output.script)
    return { ...result, outputs: filteredOutputs }
  } else {
    const result = coinSelect(
      mappedUtxos,
      [{ value: Number(value), address: to }, opReturnOutput],
      Number(satoshiPerByte)
    )
    const filteredOutputs = result.outputs?.filter((output) => !output.script)
    return { ...result, outputs: filteredOutputs }
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
