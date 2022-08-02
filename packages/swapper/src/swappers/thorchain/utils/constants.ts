import { KnownChainIds } from '@shapeshiftoss/types'
import BigNumber from 'bignumber.js'

import { bn } from '../../utils/bignumber'

export const MAX_THORCHAIN_TRADE = '100000000000000000000000000'
export const MAX_ALLOWANCE = '100000000000000000000000000'
export const THOR_MINIMUM_PADDING = 1.2
export const THOR_ETH_GAS_LIMIT = '100000' // for sends of eth / erc20 into thorchain router
export const THORCHAIN_FIXED_PRECISION = 8 // limit values are precision 8 regardless of the chain

// Used to estimate the fee thorchain will take out of the buyAsset
// Official docs on fees are incorrect
// https://discord.com/channels/838986635756044328/997675038675316776/998552541170253834
// This is still not "perfect" and tends to overestimate by a randomish amount
// TODO figure out if its possible to accurately estimate the outbound fee.
// Neither the discord nor official docs are correct
export const THOR_TRADE_FEE_MULTIPLIERS: Record<SUPPORTED_BUY_CHAINS, BigNumber> = {
  [KnownChainIds.BitcoinMainnet]: bn(2000),
  [KnownChainIds.DogecoinMainnet]: bn(2000),
  [KnownChainIds.LitecoinMainnet]: bn(500),
  [KnownChainIds.CosmosMainnet]: bn(0.02),
  [KnownChainIds.EthereumMainnet]: bn(240000).times(bn(10).exponentiatedBy(9))
}

export type SUPPORTED_BUY_CHAINS =
  | KnownChainIds.BitcoinMainnet
  | KnownChainIds.DogecoinMainnet
  | KnownChainIds.LitecoinMainnet
  | KnownChainIds.CosmosMainnet
  | KnownChainIds.EthereumMainnet
