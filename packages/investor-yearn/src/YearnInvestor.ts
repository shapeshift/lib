import { JsonRpcProvider } from '@ethersproject/providers'
import { ChainAdapter } from '@shapeshiftoss/chain-adapters'
import { Investor } from '@shapeshiftoss/investor/src'
import { ChainTypes } from '@shapeshiftoss/types'
import { Vault, Yearn } from '@yfi/sdk'
import first from 'lodash/first'
import Web3 from 'web3'
import { HttpProvider } from 'web3-core/types'
import { Contract } from 'web3-eth-contract'

import { ConstructorArgs } from './api'
import { ssRouterAbi, ssRouterContractAddress } from './constants'
import { YearnOpportunity } from './YearnOpportunity'

export class YearnInvestor implements Investor {
  public adapter: ChainAdapter<ChainTypes.Ethereum>
  public provider: HttpProvider
  public jsonRpcProvider: JsonRpcProvider
  public web3: Web3
  public vaults: Vault[]
  private yearnSdk: Yearn<1>
  private ssRouterContract: Contract

  constructor({ adapter, providerUrl, network = 1 }: ConstructorArgs) {
    this.adapter = adapter
    this.provider = new Web3.providers.HttpProvider(providerUrl)
    this.jsonRpcProvider = new JsonRpcProvider(providerUrl)
    this.web3 = new Web3(this.provider)
    this.yearnSdk = new Yearn(network, { provider: this.jsonRpcProvider })
    this.ssRouterContract = new this.web3.eth.Contract(ssRouterAbi, ssRouterContractAddress)
    this.vaults = []
  }

  async initialize() {
    await this.yearnSdk.ready
  }

  async findAll() {
    return (await this.yearnSdk.vaults.get()).map((vault) => new YearnOpportunity(vault))
  }

  async findByAddress(address: string) {
    return first(
      (await this.yearnSdk.vaults.get([address])).map((vault) => new YearnOpportunity(vault))
    )
  }
}
