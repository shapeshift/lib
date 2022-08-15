import { toAssetId } from '@shapeshiftoss/caip'
import type { ChainAdapter } from '@shapeshiftoss/chain-adapters'
import { bip32ToAddressNList, ETHSignTx, HDWallet } from '@shapeshiftoss/hdwallet-core'
import {
  ApprovalRequired,
  DepositWithdrawArgs,
  FeePriority,
  InvestorOpportunity,
} from '@shapeshiftoss/investor'
import { Logger } from '@shapeshiftoss/logger'
import { KnownChainIds } from '@shapeshiftoss/types'
import type { BigNumber } from 'bignumber.js'
import toLower from 'lodash/toLower'
import Web3 from 'web3'
import { Contract } from 'web3-eth-contract'
import { numberToHex } from 'web3-utils'

import {
  erc20Abi,
  idleCdoAbi,
  idleTokenV4Abi,
  IdleVault,
  MAX_ALLOWANCE,
  referralAddress,
  ssRouterContractAddress,
} from './constants'
import { bn, bnOrZero, normalizeAmount, toPath } from './utils'

export type PreparedTransaction = {
  chainId: number
  data: string
  estimatedGas: BigNumber
  gasPrice: BigNumber
  nonce: string
  to: string
  value: '0'
}

const feeMultipier: Record<FeePriority, number> = Object.freeze({
  fast: 1,
  average: 0.8,
  slow: 0.5,
})

type IdleOpportunityDeps = {
  chainAdapter: ChainAdapter<KnownChainIds.EthereumMainnet>
  dryRun?: true
  contract: Contract
  network?: number
  logger?: Logger
  web3: Web3
}

export type ClaimableToken = {
  assetId: string
  address: string
  amount: number
}

interface IdleClaimableOpportunity {
  getClaimableTokens(address: string): Promise<ClaimableToken[]>
}

export class IdleOpportunity
  implements
    InvestorOpportunity<PreparedTransaction, IdleVault>,
    ApprovalRequired<PreparedTransaction>,
    IdleClaimableOpportunity
{
  readonly #internals: {
    chainAdapter: ChainAdapter<KnownChainIds.EthereumMainnet>
    dryRun?: true
    routerContract: Contract
    logger?: Logger
    web3: Web3
    network?: number
  }

  /**
   * Opportunity id e.g., contract address or validator address
   */
  readonly id: string
  readonly version: string
  readonly name: string
  readonly displayName: string
  readonly isApprovalRequired: true
  readonly underlyingAsset: { assetId: string; balance: BigNumber }
  readonly positionAsset: {
    /**
     * Asset that represents their position
     */
    assetId: string
    /**
     * The amount of the position asset belonging to the user
     *
     * This represents the value of their staked/delegated position
     *
     * Amount is an integer value without precision applied
     */
    balance: BigNumber // This is probably a wallet concern not a opportunity concern
    /**
     * The ratio of value between the underlying asset and the position asset
     * in terms of underlying asset per position asset.
     *
     * Multiply the position asset amount by this value to calculate the amount of
     * underlying asset that will be received for a withdrawal
     */
    underlyingPerPosition: BigNumber
  }
  readonly feeAsset: {
    /**
     * Asset used to pay transaction fees
     */
    assetId: string
  }
  /**
   * The estimated return on deposited assets
   *
   * @example An APY of "1.0" means 100%
   */
  readonly apy: BigNumber
  readonly tvl: {
    assetId: string
    balance: BigNumber
    balanceUsdc: BigNumber
  }

  /**
   * Protocol specific information
   */
  readonly metadata: IdleVault
  readonly isNew: boolean
  readonly expired: boolean

  constructor(deps: IdleOpportunityDeps, vault: IdleVault) {
    this.#internals = {
      chainAdapter: deps.chainAdapter,
      dryRun: deps.dryRun,
      logger: deps.logger ?? new Logger({ name: 'Idle Opportunity' }),
      routerContract: deps.contract,
      web3: deps.web3,
      network: deps.network,
    }

    // this.metadata = vault.metadata
    this.id = toLower(vault.address)
    this.metadata = {
      ...vault,
      apy: {
        net_apy: parseFloat(bnOrZero(vault.apr).div(100).toFixed()),
      },
    }
    this.version = `${vault.protocolName} ${vault.strategy}`.trim()
    this.name = vault.poolName
    this.displayName = vault.poolName
    this.isNew = false
    this.expired = false
    this.apy = bnOrZero(vault.apr).div(100)
    this.tvl = {
      balanceUsdc: normalizeAmount(vault.tvl, 6),
      balance: normalizeAmount(vault.underlyingTVL),
      assetId: toAssetId({
        chainId: 'eip155:1',
        assetNamespace: 'erc20',
        assetReference: vault.address,
      }),
    }
    this.underlyingAsset = {
      balance: bn(0),
      assetId: toAssetId({
        chainId: 'eip155:1',
        assetNamespace: 'erc20',
        assetReference: vault.underlyingAddress,
      }),
    }
    this.positionAsset = {
      balance: bn(0),
      assetId: toAssetId({
        chainId: 'eip155:1',
        assetNamespace: 'erc20',
        assetReference: vault.address,
      }),
      underlyingPerPosition: normalizeAmount(vault.pricePerShare),
    }
    this.feeAsset = {
      assetId: 'eip155:1/slip44:60',
    }
  }

  /**
   * Prepare an unsigned withdrawal transaction
   *
   * @param input.address - The user's wallet address where the funds are
   * @param input.amount - The amount (as an integer value) of the position asset
   */
  async prepareWithdrawal(input: DepositWithdrawArgs): Promise<PreparedTransaction> {
    const { address, amount } = input
    // We use the vault directly to withdraw the vault tokens. There is no benefit to the DAO to use
    // the router to withdraw funds and there is an extra approval required for the user if we
    // withdrew from the vault using the shapeshift router. Affiliate fees for SS are the same
    // either way. For this reason, we simply withdraw from the vault directly.

    let methodName: string
    let vaultContract: Contract

    // Handle Tranche Withdraw
    if (this.metadata.cdoAddress) {
      vaultContract = new this.#internals.web3.eth.Contract(idleCdoAbi, this.metadata.cdoAddress)
      const trancheType = /senior/i.test(this.metadata.strategy) ? 'AA' : 'BB'
      methodName = `withdraw${trancheType}`
    } else {
      vaultContract = new this.#internals.web3.eth.Contract(idleTokenV4Abi, this.id)
      methodName = `redeemIdleToken`
    }

    // console.log('prepareWithdrawal', methodName, address, amount.toFixed())

    const preWithdraw = await vaultContract.methods[methodName](amount.toFixed())

    // console.log('prepareWithdrawal - preWithdraw', preWithdraw)

    const data = await preWithdraw.encodeABI({ from: address })

    // console.log('prepareWithdrawal - data', data)

    const estimatedGas = bnOrZero(await preWithdraw.estimateGas({ from: address }))

    // console.log('prepareWithdrawal - estimatedGas', estimatedGas)

    const nonce = await this.#internals.web3.eth.getTransactionCount(address)

    // console.log('prepareWithdrawal - nonce', nonce)

    const gasPrice = bnOrZero(await this.#internals.web3.eth.getGasPrice())

    // console.log('prepareWithdrawal - gasPrice', gasPrice)

    return {
      chainId: 1,
      data,
      estimatedGas,
      gasPrice,
      nonce: String(nonce),
      to: vaultContract.options.address,
      value: '0',
    }
  }

  public async prepareClaimTokens(address: string): Promise<PreparedTransaction> {
    const vaultContract = new this.#internals.web3.eth.Contract(idleTokenV4Abi, this.id)

    // console.log('prepareWithdrawal', address)

    const preWithdraw = await vaultContract.methods.redeemIdleToken(0)

    // console.log('prepareWithdrawal - preWithdraw', preWithdraw)

    const data = await preWithdraw.encodeABI({ from: address })

    // console.log('prepareWithdrawal - data', data)

    const estimatedGas = bnOrZero(await preWithdraw.estimateGas({ from: address }))

    // console.log('prepareWithdrawal - estimatedGas', estimatedGas)

    const nonce = await this.#internals.web3.eth.getTransactionCount(address)

    // console.log('prepareWithdrawal - nonce', nonce)

    const gasPrice = bnOrZero(await this.#internals.web3.eth.getGasPrice())

    // console.log('prepareWithdrawal - gasPrice', gasPrice)

    return {
      chainId: 1,
      data,
      estimatedGas,
      gasPrice,
      nonce: String(nonce),
      to: vaultContract.options.address,
      value: '0',
    }
  }

  /**
   * Prepare an unsigned deposit transaction
   *
   * @param input.address - The user's wallet address where the funds are
   * @param input.amount - The amount (as an integer value) of the underlying asset
   */
  async prepareDeposit(input: DepositWithdrawArgs): Promise<PreparedTransaction> {
    const { address, amount } = input

    // In order to properly earn affiliate revenue, we must deposit to the vault through the SS
    // router contract. This is not necessary for withdraws. We can withdraw directly from the vault
    // without affecting the DAOs affiliate revenue.

    let methodName: string
    let methodParams: string[]
    let vaultContract: Contract

    // Handle Tranche Withdraw
    if (this.metadata.cdoAddress) {
      vaultContract = this.#internals.routerContract
      const trancheType = /senior/i.test(this.metadata.strategy) ? 'AA' : 'BB'
      methodName = `deposit${trancheType}`
      methodParams = [this.metadata.cdoAddress, amount.toFixed()]
    } else {
      methodName = 'mintIdleToken'
      methodParams = [amount.toFixed(), 'true', referralAddress]
      vaultContract = new this.#internals.web3.eth.Contract(idleTokenV4Abi, this.id)
    }

    const preDeposit = await vaultContract.methods[methodName](...methodParams)

    // console.log('prepareDeposit - routerContract.deposit', preDeposit)

    const data = await preDeposit.encodeABI({ from: address })

    // console.log('prepareDeposit - data', data)

    const estimatedGas = bnOrZero(await preDeposit.estimateGas({ from: address }))

    // console.log('prepareDeposit - estimatedGas', estimatedGas)

    const nonce = await this.#internals.web3.eth.getTransactionCount(address)

    // console.log('prepareDeposit - nonce', nonce)

    const gasPrice = bnOrZero(await this.#internals.web3.eth.getGasPrice())

    // console.log('prepareDeposit - gasPrice', gasPrice)

    return {
      chainId: 1,
      data,
      estimatedGas,
      gasPrice,
      nonce: String(nonce),
      to: vaultContract.options.address,
      value: '0',
    }
  }

  /**
   * Prepare an unsigned deposit transaction
   *
   * @param input.address - The user's wallet address where the funds are
   */
  async getClaimableTokens(address: string): Promise<ClaimableToken[]> {
    if (this.metadata.cdoAddress) {
      return []
    }

    // console.log('getClaimableTokens - address', address)
    // console.log('getClaimableTokens - vaultId', this.id)

    const claimableTokens: ClaimableToken[] = []
    const vaultContract: Contract = new this.#internals.web3.eth.Contract(idleTokenV4Abi, this.id)
    const govTokensAmounts = await vaultContract.methods.getGovTokensAmounts(address).call()

    // console.log('getClaimableTokens - govTokensAmounts', govTokensAmounts)

    for (let i = 0; i < govTokensAmounts.length; i++) {
      const govTokenAddress = await vaultContract.methods.govTokens(i).call()

      // console.log(`getClaimableTokens - govTokenAddress(${i})`, govTokenAddress)

      if (govTokenAddress) {
        claimableTokens.push({
          assetId: toAssetId({
            chainId: 'eip155:1',
            assetNamespace: 'erc20',
            assetReference: govTokenAddress,
          }),
          address: govTokenAddress,
          amount: govTokensAmounts[i],
        })
      }
    }

    // console.log('getClaimableTokens - claimableTokens', claimableTokens)

    return claimableTokens
  }

  public async allowance(address: string): Promise<BigNumber> {
    const depositTokenContract: Contract = new this.#internals.web3.eth.Contract(
      erc20Abi,
      this.metadata.underlyingAddress,
    )

    let vaultContract: Contract

    // Handle Tranche Withdraw
    if (this.metadata.cdoAddress) {
      vaultContract = this.#internals.routerContract
    } else {
      vaultContract = new this.#internals.web3.eth.Contract(idleTokenV4Abi, this.id)
    }

    const allowance = await depositTokenContract.methods
      .allowance(address, vaultContract.options.address)
      .call()

    return bnOrZero(allowance)
  }

  async prepareApprove(address: string): Promise<PreparedTransaction> {
    const depositTokenContract = new this.#internals.web3.eth.Contract(
      erc20Abi,
      this.metadata.underlyingAddress,
    )

    let vaultContractAddress: string

    // Handle Tranche Withdraw
    if (this.metadata.cdoAddress) {
      vaultContractAddress = ssRouterContractAddress
    } else {
      vaultContractAddress = this.id
    }

    const preApprove = await depositTokenContract.methods.approve(
      vaultContractAddress,
      MAX_ALLOWANCE,
    )
    const data = await preApprove.encodeABI({ from: address })
    const estimatedGas = bnOrZero(await preApprove.estimateGas({ from: address }))

    const nonce: number = await this.#internals.web3.eth.getTransactionCount(address)
    const gasPrice = bnOrZero(await this.#internals.web3.eth.getGasPrice())

    return {
      chainId: 1,
      data,
      estimatedGas,
      gasPrice,
      nonce: String(nonce),
      to: this.metadata.underlyingAddress,
      value: '0',
    }
  }

  /**
   * Sign and broadcast a previously prepared transaction
   */
  async signAndBroadcast(input: {
    wallet: HDWallet
    tx: PreparedTransaction
    feePriority?: FeePriority
  }): Promise<string> {
    const { wallet, tx, feePriority } = input
    const feeSpeed: FeePriority = feePriority ? feePriority : 'fast'
    const chainAdapter = this.#internals.chainAdapter

    const path = toPath(chainAdapter.buildBIP44Params({ accountNumber: 0 }))
    const addressNList = bip32ToAddressNList(path)
    const gasPrice = numberToHex(bnOrZero(tx.gasPrice).times(feeMultipier[feeSpeed]).toString())
    const txToSign: ETHSignTx = {
      ...tx,
      gasPrice,
      // Gas limit safety factor of 50% to prevent out of gas errors on chain.
      gasLimit: numberToHex(tx.estimatedGas.times(1.5).integerValue().toString()),
      nonce: numberToHex(tx.nonce),
      value: numberToHex(tx.value),
      addressNList,
    }

    // console.log('signAndBroadcast', txToSign)

    if (wallet.supportsOfflineSigning()) {
      const signedTx = await chainAdapter.signTransaction({ txToSign, wallet })
      if (this.#internals.dryRun) return signedTx
      return chainAdapter.broadcastTransaction(signedTx)
    } else if (wallet.supportsBroadcast() && chainAdapter.signAndBroadcastTransaction) {
      if (this.#internals.dryRun) {
        throw new Error(`Cannot perform a dry run with wallet of type ${wallet.getVendor()}`)
      }
      return chainAdapter.signAndBroadcastTransaction({ txToSign, wallet })
    } else {
      throw new Error('Invalid HDWallet configuration')
    }
  }

  /**
   * This just makes the logging in the CLI easier to read
   * @returns
   */
  [Symbol.for('nodejs.util.inspect.custom')]() {
    return {
      id: this.id,
      metadata: this.metadata,
      displayName: this.displayName,
      apy: this.apy.toString(),
      tvl: {
        assetId: this.tvl.assetId,
        balance: this.tvl.balance.toString(),
      },
      underlyingAsset: {
        balance: this.underlyingAsset.balance.toString(),
        assetId: this.underlyingAsset.assetId,
      },
      positionAsset: {
        balance: this.positionAsset.balance.toString(),
        assetId: this.positionAsset.assetId,
        price: this.positionAsset.underlyingPerPosition.toString(),
      },
    }
  }
}
