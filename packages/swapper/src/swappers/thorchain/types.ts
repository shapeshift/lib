import { ChainId } from '@shapeshiftoss/caip'
import { ChainAdapterManager } from '@shapeshiftoss/chain-adapters'
import { BTCSignTx, CosmosSignTx, ETHSignTx } from '@shapeshiftoss/hdwallet-core'
import { KnownChainIds } from '@shapeshiftoss/types'
import type Web3 from 'web3'

import { Trade } from '../../api'

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

type MidardCoins = {
  asset: string
}[]
type MidgardActionOut = {
  coins: MidardCoins
  txID: string
}
type MidgardAction = {
  date: string
  height: string
  out: MidgardActionOut[]
  status: string
  type: string
}

export type MidgardActionsResponse = {
  actions: MidgardAction[]
}

export type InboundResponse = {
  chain: string
  pub_key: string
  address: string
  halted: boolean
  gas_rate: string
  router?: string
}

export type ThorchainSwapperDeps = {
  midgardUrl: string
  adapterManager: ChainAdapterManager
  web3: Web3
}

export interface BtcThorTrade<C extends ChainId> extends Trade<C> {
  chainId: ThorChainUtxoChainIds
  txData: BTCSignTx
}

export interface EthThorTrade<C extends ChainId> extends Trade<C> {
  chainId: KnownChainIds.EthereumMainnet
  txData: ETHSignTx
}

export interface CosmosThorTrade<C extends ChainId> extends Trade<C> {
  chainId: KnownChainIds.CosmosMainnet
  txData: CosmosSignTx
}

export type ThorTrade<C extends ChainId> = BtcThorTrade<C> | EthThorTrade<C> | CosmosThorTrade<C>

export type ThorChainUtxoChainIds =
  | KnownChainIds.BitcoinMainnet
  | KnownChainIds.DogecoinMainnet
  | KnownChainIds.LitecoinMainnet
  | KnownChainIds.BitcoinCashMainnet
