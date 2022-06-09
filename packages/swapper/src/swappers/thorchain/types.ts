import { ChainId } from '@shapeshiftoss/caip'
import { ChainAdapter } from '@shapeshiftoss/chain-adapters'

export type PoolResponse = {
  asset: string
  assetDepth: string
  assetPrice: string
  assetPriceUSD: string
  liquidityUnits: string
  poolAPY: string
  runeDepth: string
  status: string
  synthSupply: string
  synthUnits: string
  units: string
  volume24h: string
}

export type InboundResponse = {
  chain: string
  pub_key: string
  address: string
  halted: boolean
  gas_rate: string
  router?: string
}

type ChainIdChainNamespace = Map<ChainId, ChainAdapter<ChainId>>

export type ThorchainSwapperDeps = {
  midgardUrl: string
  adapterMap: ChainIdChainNamespace
}
