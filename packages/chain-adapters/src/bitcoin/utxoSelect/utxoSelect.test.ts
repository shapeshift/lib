import { utxoSelect } from './utxoSelect'

const utxoSelectInput = {
  utxos: [
    {
      txid: 'ef935d850e7d596f98c6e24d5f25faa770f6e6d8e5eab94dea3e2154c3643986',
      vout: 0,
      value: '1598',
      height: 705718,
      confirmations: 2,
      address: 'bc1qpszctuml70ulzf7f0zy5r4sg9nm65qfpgcw0uy',
      path: "m/84'/0'/0'/0/1"
    },
    {
      txid: 'adb979b44c86393236e307c45f9578d9bd064134a2779b4286c158c51ad4ab05',
      vout: 0,
      value: '31961',
      height: 705718,
      confirmations: 2,
      address: 'bc1qpszctuml70ulzf7f0zy5r4sg9nm65qfpgcw0uy',
      path: "m/84'/0'/0'/0/1"
    }
  ],
  to: 'bc1qppzsgs9pt63cx9x994wf4e3qrpta0nm6htk9v4',
  satoshiPerByte: '1',
  value: '400'
}

describe('utxoSelect', () => {
  it('should return correct inputs and outputs for a standard tx', () => {
    const expectedOutput = {
      inputs: [
        {
          txid: 'adb979b44c86393236e307c45f9578d9bd064134a2779b4286c158c51ad4ab05',
          vout: 0,
          value: 31961,
          height: 705718,
          confirmations: 2,
          address: 'bc1qpszctuml70ulzf7f0zy5r4sg9nm65qfpgcw0uy',
          path: "m/84'/0'/0'/0/1"
        }
      ],
      outputs: [
        {
          value: 400,
          address: 'bc1qppzsgs9pt63cx9x994wf4e3qrpta0nm6htk9v4'
        },
        { value: 31335 }
      ],
      fee: 226
    }
    const result = utxoSelect({ ...utxoSelectInput, sendMax: false })
    expect(result).toEqual(expectedOutput)
  })
  it('should return correct inputs and outputs for a send max tx', () => {
    const expectedOutput = {
      inputs: [
        {
          txid: 'ef935d850e7d596f98c6e24d5f25faa770f6e6d8e5eab94dea3e2154c3643986',
          vout: 0,
          value: 1598,
          height: 705718,
          confirmations: 2,
          address: 'bc1qpszctuml70ulzf7f0zy5r4sg9nm65qfpgcw0uy',
          path: "m/84'/0'/0'/0/1"
        },
        {
          txid: 'adb979b44c86393236e307c45f9578d9bd064134a2779b4286c158c51ad4ab05',
          vout: 0,
          value: 31961,
          height: 705718,
          confirmations: 2,
          address: 'bc1qpszctuml70ulzf7f0zy5r4sg9nm65qfpgcw0uy',
          path: "m/84'/0'/0'/0/1"
        }
      ],
      outputs: [
        {
          address: 'bc1qppzsgs9pt63cx9x994wf4e3qrpta0nm6htk9v4',
          value: 33219
        }
      ],
      fee: 340
    }
    const result = utxoSelect({ ...utxoSelectInput, sendMax: true })

    expect(result).toEqual(expectedOutput)
  })
})
