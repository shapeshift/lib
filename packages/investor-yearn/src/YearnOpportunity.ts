import { JsonRpcProvider } from '@ethersproject/providers'
import { adapters } from '@shapeshiftoss/caip'
import type { ChainAdapter } from '@shapeshiftoss/chain-adapters/*'
import type { ApprovalRequired, InvestorOpportunity } from '@shapeshiftoss/investor/src'
import { Logger } from '@shapeshiftoss/logger'
import type { ChainTypes } from '@shapeshiftoss/types'
import { type ChainId, type Vault, type VaultMetadata, Yearn } from '@yfi/sdk'
import type { BigNumber } from 'bignumber.js'
import Web3 from 'web3'
import { HttpProvider } from 'web3-core'
import { Contract } from 'web3-eth-contract'

import { ssRouterAbi, ssRouterContractAddress, yv2VaultAbi } from './constants'
import { buildTxToSign } from './utils'
import { bnOrZero } from './utils/bignumber'

type YearnOpportunityDeps = {
  chainAdapter: ChainAdapter<ChainTypes>
  logger?: Logger
  providerUrl: string
  network?: ChainId
}

export class YearnOpportunity implements InvestorOpportunity<VaultMetadata>, ApprovalRequired {
  readonly #internals: {
    chainAdapter: ChainAdapter<ChainTypes>
    httpProvider: HttpProvider
    jsonRpcProvider: JsonRpcProvider
    web3: Web3
    yearn: Yearn<ChainId>
    contract: Contract
    logger?: Logger
    vault: Vault
  }
  public readonly apr: BigNumber
  public readonly displayName: string
  public readonly id: string
  public readonly isApprovalRequired: true
  public readonly metadata: VaultMetadata
  public readonly underlyingAsset: { assetId: string; balance: BigNumber }
  public readonly positionAsset: { assetId: string; balance: BigNumber }
  public readonly price: BigNumber
  public readonly supply: BigNumber
  public readonly tvl: BigNumber

  constructor(deps: YearnOpportunityDeps, vault: Vault) {
    const httpProvider = new HttpProvider(deps.providerUrl)
    const jsonRpcProvider = new JsonRpcProvider(deps.providerUrl)

    this.#internals = {
      chainAdapter: deps.chainAdapter,
      contract: new Contract(ssRouterAbi, ssRouterContractAddress),
      httpProvider: new HttpProvider(deps.providerUrl),
      jsonRpcProvider: new JsonRpcProvider(deps.providerUrl),
      logger: deps.logger ?? new Logger({ name: 'Yearn Opportunity' }),
      web3: new Web3(httpProvider),
      yearn: new Yearn(deps.network ?? 1, { provider: jsonRpcProvider }),
      vault
    }

    this.id = vault.address
    this.metadata = vault.metadata
    this.displayName = vault.metadata.displayName || vault.name
    this.apr = bnOrZero(vault.metadata.apy?.net_apy)
    this.supply = bnOrZero(vault.metadata.totalSupply)
    this.tvl = bnOrZero(vault.metadata.totalAssets)
    this.price = bnOrZero(vault.metadata.pricePerShare)
    this.underlyingAsset = {
      balance: bnOrZero(vault.underlyingTokenBalance.amount),
      assetId: adapters.yearnToCAIP19(vault.token)
    }
    this.positionAsset = {
      balance: bnOrZero(vault.underlyingTokenBalance.amount),
      assetId: adapters.yearnToCAIP19(vault.tokenId)
    }
  }

  private update() {
    // re-fetch data and update state
  }

  public signAndBroadcast(tx: unknown): Promise<unknown> {
    return Promise.resolve(undefined)
  }

  public deposit(amount: BigNumber): Promise<unknown> {
    return Promise.resolve(undefined)
  }

  async withdraw(address: string, amount: BigNumber): Promise<unknown> {
    // @TODO: Validate address and amount
    const estimatedGas: BigNumber = await this.estimateWithdrawGas(input)

    // We use the vault directly to withdraw the vault tokens. There is no benefit to the DAO to use
    // the router to withdraw funds and there is an extra approval required for the user if we
    // withdrew from the vault using the shapeshift router. Affiliate fees for SS are the same
    // either way. For this reason, we simply withdraw from the vault directly.
    const vaultContract: Contract = new this.web3.eth.Contract(yv2VaultAbi, vaultAddress)
    const data: string = vaultContract.methods
      .withdraw(amount.toString(), address)
      .encodeABI({ from: address })
    const nonce = await this.#internals.web3.eth.getTransactionCount(address)
    const gasPrice = await this.#internals.web3.eth.getGasPrice()

    const txToSign = buildTxToSign({
      bip44Params: this.#internals.chainAdapter.buildBIP44Params({ accountNumber: 0 }),
      chainId: 1,
      data,
      estimatedGas: estimatedGas.toString(),
      gasPrice,
      nonce: String(nonce),
      to: this._vault.address,
      value: '0'
    })
    if (wallet.supportsOfflineSigning()) {
      const signedTx = await this.#internals.chainAdapter.signTransaction({ txToSign, wallet })
      if (dryRun) return signedTx
      return this.#internals.chainAdapter.broadcastTransaction(signedTx)
    } else if (
      wallet.supportsBroadcast() &&
      this.#internals.chainAdapter.signAndBroadcastTransaction
    ) {
      if (dryRun) {
        throw new Error(`Cannot perform a dry run with wallet of type ${wallet.getVendor()}`)
      }
      return this.#internals.chainAdapter.signAndBroadcastTransaction({ txToSign, wallet })
    } else {
      throw new Error('Invalid HDWallet configuration ')
    }
  }

  public allowance(): Promise<unknown> {
    return Promise.resolve(undefined)
  }

  public approve(): Promise<unknown> {
    return Promise.resolve(undefined)
  }
}
