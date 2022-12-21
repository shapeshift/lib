import type { ChainAdapter } from '@shapeshiftoss/chain-adapters'
import { Investor } from '@shapeshiftoss/investor'
import { Logger } from '@shapeshiftoss/logger'
import { KnownChainIds } from '@shapeshiftoss/types'
import { find } from 'lodash'
import filter from 'lodash/filter'
import Web3 from 'web3'
import { Contract } from 'web3-eth-contract'

import { OsmosisPool } from './constants'
import { OsmosisOpportunity, PreparedTransaction } from './OsmosisOpportunity'
import { OsmosisSdk } from './OsmosisSdk'

type ConstructorArgs = {
  chainAdapter: ChainAdapter<KnownChainIds.OsmosisMainnet>
  dryRun?: true
  network?: number
  providerUrl: string
}

const osmosisSdk = new OsmosisSdk()

export class OsmosisInvestor implements Investor<PreparedTransaction, OsmosisPool> {
  readonly #deps: {
    chainAdapter: ChainAdapter<KnownChainIds.OsmosisMainnet>
    dryRun?: true
    logger?: Logger
  }
  #opportunities: OsmosisOpportunity[]

  constructor({ chainAdapter, dryRun }: ConstructorArgs) {
    this.#deps = Object.freeze({
      chainAdapter,
      dryRun,
    })
    this.#opportunities = []
  }

  async initialize() {
    const pools: OsmosisPool[] = await osmosisSdk.getPools()
    this.#opportunities = pools.map((pool) => new OsmosisOpportunity(this.#deps, pool))
  }

  async findAll() {
    return this.#opportunities
  }

  async findByOpportunityId(opportunityId: string) {
    return find(
      await this.findAll(),
      (opp: OsmosisOpportunity) => opp.positionAsset.assetId === opportunityId,
    )
  }

  async findByUnderlyingAssetId(assetId: string) {
    return filter(await this.findAll(), { underlyingAsset: { assetId } })
  }
}
