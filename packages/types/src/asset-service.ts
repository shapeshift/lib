import { ChainTypes, ContractTypes, NetworkTypes } from './common'

type NetworkDetails = {
  chain: ChainTypes
  network: NetworkTypes
  slip44: number
  explorer: string
  explorerTxLink: string
}

type AssetDetails = {
  symbol: string
  name: string
  precision: number
  color: string
  secondaryColor: string
  icon: string
  sendSupport: boolean
  receiveSupport: boolean
}

type TokenDetails = {
  tokenId: string
  contractType: ContractTypes
}

export type Token = AssetDetails & TokenDetails
export type AssetData = AssetDetails & NetworkDetails & { tokens?: Array<Token> }
export type Asset = AssetDetails & NetworkDetails & Partial<TokenDetails>
