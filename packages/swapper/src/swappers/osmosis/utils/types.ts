import { HDWallet } from '@shapeshiftoss/hdwallet-core'
import { ChainAdapterManager } from 'packages/chain-adapters'

export type OsmoSwapperDeps = {
  wallet: HDWallet
  adapterManager: ChainAdapterManager
  osmoUrl: string
  cosmosUrl: string
}

export type IbcTransferInput = {
  sender: string
  receiver: string
  amount: string
}

export type PoolInfo = {
  poolAssets: PoolAssetInfo[]
  poolParams: {
    swapFee: string
  }
}

export type PoolAssetInfo = {
  token: {
    amount: string
  }
}
