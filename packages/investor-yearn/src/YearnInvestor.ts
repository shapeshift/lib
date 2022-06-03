import { JsonRpcProvider } from '@ethersproject/providers'
import type { ChainAdapter } from '@shapeshiftoss/chain-adapters'
import { Investor } from '@shapeshiftoss/investor'
import type { ChainTypes } from '@shapeshiftoss/types'
import { type ChainId, type VaultMetadata, Yearn } from '@yfi/sdk'
import { find } from 'lodash'
import filter from 'lodash/filter'
import Web3 from 'web3'
import { Contract } from 'web3-eth-contract'

import { ssRouterAbi, ssRouterContractAddress } from './constants'
import { PreparedTransaction, YearnOpportunity } from './YearnOpportunity'

type ConstructorArgs = {
  dryRun?: true
  providerUrl: string
  network?: ChainId
  chainAdapter: ChainAdapter<ChainTypes.Ethereum>
}

export class YearnInvestor implements Investor<PreparedTransaction, VaultMetadata> {
  #deps: {
    web3: Web3
    yearnSdk: Yearn<1>
    contract: Contract
    dryRun?: true
    chainAdapter: ChainAdapter<ChainTypes.Ethereum>
  }
  #opportunities: YearnOpportunity[]

  constructor({ dryRun, providerUrl, network = 1, chainAdapter }: ConstructorArgs) {
    const httpProvider = new Web3.providers.HttpProvider(providerUrl)
    const jsonRpcProvider = new JsonRpcProvider(providerUrl)

    const web3 = new Web3(httpProvider)
    this.#deps = Object.freeze({
      chainAdapter,
      dryRun,
      web3,
      yearnSdk: new Yearn(network, { provider: jsonRpcProvider }),
      contract: new web3.eth.Contract(ssRouterAbi, ssRouterContractAddress)
    })
    this.#opportunities = []
  }

  async initialize() {
    await this.#deps.yearnSdk.ready
    this.#opportunities = (await this.#deps.yearnSdk.vaults.get()).map(
      (vault) => new YearnOpportunity(this.#deps, vault)
    )
  }

  async findAll() {
    return this.#opportunities
  }

  async findByOpportunityId(opportunityId: string) {
    return find(
      await this.findAll(),
      (opp: YearnOpportunity) => opp.positionAsset.assetId === opportunityId
    )
  }

  async findByUnderlyingAssetId(assetId: string) {
    return filter(await this.findAll(), { underlyingAsset: { assetId } })
  }
}
