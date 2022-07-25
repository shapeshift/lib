import Web3 from 'web3'
// import https from 'https'
import { find } from 'lodash'
import filter from 'lodash/filter'
import { IdleSdk } from './IdleSdk'
import { Contract } from 'web3-eth-contract'
import { Logger } from '@shapeshiftoss/logger'
import { Investor } from '@shapeshiftoss/investor'
import { KnownChainIds } from '@shapeshiftoss/types'
import type { ChainAdapter } from '@shapeshiftoss/chain-adapters'
import { PreparedTransaction, IdleOpportunity } from './IdleOpportunity'
import { IdleVault, ssRouterAbi, ssRouterContractAddress } from './constants'

type ConstructorArgs = {
  chainAdapter: ChainAdapter<KnownChainIds.EthereumMainnet>
  dryRun?: true
  network?: number
  providerUrl: string
}

// const makeRequest = async (url: string): Promise<string> =>  {
//   return await (new Promise(async (resolve) => {
//     https.get(url, res => {
//       res.setEncoding("utf8");
//       let body = "";
//       res.on("data", data => {
//         body += data;
//       });
//       res.on("end", () => {
//         resolve(body);
//       });
//     });
//   }));
// }
const idleSdk = new IdleSdk();

export class IdleInvestor implements Investor<PreparedTransaction, IdleVault> {
  readonly #deps: {
    chainAdapter: ChainAdapter<KnownChainIds.EthereumMainnet>
    dryRun?: true
    contract: Contract
    network?: number
    logger?: Logger
    web3: Web3
  }
  #opportunities: IdleOpportunity[]

  constructor({ chainAdapter, dryRun, providerUrl, network = 1 }: ConstructorArgs) {
    const httpProvider = new Web3.providers.HttpProvider(providerUrl)
    // const jsonRpcProvider = new JsonRpcProvider(providerUrl)
    const web3 = new Web3(httpProvider)
    const contract = new web3.eth.Contract(ssRouterAbi, ssRouterContractAddress);
    this.#deps = Object.freeze({
      chainAdapter,
      contract,
      network,
      dryRun,
      web3
    })
    this.#opportunities = []
  }

  async initialize() {

    // const vaults = await makeRequest('http://localhost:3333/pools?api-key=bPrtC2bfnAvapyXLgdvzVzW8u8igKv6E');
    // if (vaults){
      // this.#vaults = JSON.parse(vaults);
      const vaults: IdleVault[] = await idleSdk.getVaults()
      // this.#vaults = availableTokens
      this.#opportunities = vaults.map(
        (vault) => new IdleOpportunity(this.#deps, vault)
      );
    // }
  }

  async findAll() {
    return this.#opportunities
  }

  async findByOpportunityId(opportunityId: string) {
    return find(
      await this.findAll(),
      (opp: IdleOpportunity) => opp.positionAsset.assetId === opportunityId
    )
  }

  async findByUnderlyingAssetId(assetId: string) {
    return filter(await this.findAll(), { underlyingAsset: { assetId } })
  }
}
