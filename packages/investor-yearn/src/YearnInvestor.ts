import { JsonRpcProvider } from '@ethersproject/providers'
import { Investor } from '@shapeshiftoss/investor'
import { VaultMetadata, Yearn, ChainId } from '@yfi/sdk'
import find from 'lodash/find'
import first from 'lodash/first'
import Web3 from 'web3'
import { Contract } from 'web3-eth-contract'

import { ssRouterAbi, ssRouterContractAddress } from './constants'
import { YearnOpportunity, PreparedTransaction } from './YearnOpportunity'

type ConstructorArgs = {
  dryRun?: true,
  providerUrl: string,
  network?: ChainId
}

export class YearnInvestor implements Investor<PreparedTransaction, VaultMetadata> {
  #deps: {
    web3: Web3
    yearnSdk: Yearn<1>
    contract: Contract
    dryRun?: true
  }

  constructor({ dryRun, providerUrl, network = 1 }: ConstructorArgs) {
    const httpProvider = new Web3.providers.HttpProvider(providerUrl)
    const jsonRpcProvider = new JsonRpcProvider(providerUrl)

    this.#deps = Object.freeze({
      dryRun,
      web3: new Web3(httpProvider),
      yearnSdk: new Yearn(network, { provider: jsonRpcProvider }),
      contract: new Contract(ssRouterAbi, ssRouterContractAddress)
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
    return find(await this.findAll(), { underlyingAsset: { assetId } })
  }
}
