import { HDWallet } from '@shapeshiftoss/hdwallet-core'
import { BIP44Params } from '@shapeshiftoss/types'

export type BuildDepositTxInput = {
  memo: string
  value: string
  wallet: HDWallet
  gas: string
  fee: string
  bip44Params: BIP44Params // TODO mandatory for multi account
  sendMax?: boolean
  // for synth support:
  // asset?: AssetId // synths/ibc?
}
