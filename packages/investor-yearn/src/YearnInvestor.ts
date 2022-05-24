import { JsonRpcProvider } from '@ethersproject/providers'
import { Investor } from '@shapeshiftoss/investor'
import { type ChainId, type VaultMetadata, Yearn } from '@yfi/sdk'
import filter from 'lodash/filter'
import first from 'lodash/first'
import type { ChainTypes } from '@shapeshiftoss/types'
import Web3 from 'web3'
import { Contract } from 'web3-eth-contract'

import { ssRouterAbi, ssRouterContractAddress } from './constants'
import { PreparedTransaction, YearnOpportunity } from './YearnOpportunity'

type ConstructorArgs = {
  dryRun?: true,
  providerUrl: string,
  network?: ChainId
}

export class YearnInvestor implements Investor<ChainTypes.Ethereum, PreparedTransaction, VaultMetadata> {
  #deps: {
    web3: Web3
    yearnSdk: Yearn<1>
    contract: Contract
    dryRun?: true
  }

  constructor({ dryRun, providerUrl, network = 1 }: ConstructorArgs) {
    const httpProvider = new Web3.providers.HttpProvider(providerUrl)
    const jsonRpcProvider = new JsonRpcProvider(providerUrl)

    const web3 = new Web3(httpProvider)
    this.#deps = Object.freeze({
      dryRun,
      web3,
      yearnSdk: new Yearn(network, { provider: jsonRpcProvider }),
      contract: new web3.eth.Contract(ssRouterAbi, ssRouterContractAddress)
    })
  }

  async initialize() {
    await this.#deps.yearnSdk.ready
  }

  async findAll() {
    return (await this.#deps.yearnSdk.vaults.get()).map(
      (vault) => new YearnOpportunity(this.#deps, vault)
    )
  }

  async findByOpportunityId(opportunityId: string) {
    return first(
      (await this.#deps.yearnSdk.vaults.get([opportunityId])).map(
        (vault) => new YearnOpportunity(this.#deps, vault)
      )
    )
  }

  async findByUnderlyingAssetId(assetId: string) {
    return filter(await this.findAll(), { underlyingAsset: { assetId } })
  }
}
