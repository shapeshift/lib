import { AssetBalance, FeeData } from '.'

export type Account = {
  nonce: number
  tokens?: Array<AssetBalance>
}

export type EthereumFeeData = FeeData & {
  gasPrice: string
  gasLimit: string
  maxFeePerGas: string
  maxPriorityFeePerGas: string
}

export type BuildTxInput = {
  gasLimit: string
  erc20ContractAddress?: string
} & (
  | {
      gasPrice: string
      maxFeePerGas?: never
      maxPriorityFeePerGas?: never
    }
  | {
      gasPrice?: never
      maxFeePerGas: string
      maxPriorityFeePerGas: string
    }
)

export type GetFeeDataInput = {
  contractAddress?: string
  from: string
  contractData?: string
}
