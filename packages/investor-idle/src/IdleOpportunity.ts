import Web3 from 'web3'
import {
  FeePriority,
  ApprovalRequired,
  DepositWithdrawArgs,
  InvestorOpportunity
} from '@shapeshiftoss/investor'
import isNil from 'lodash/isNil'
import toLower from 'lodash/toLower'
import { numberToHex } from 'web3-utils'
import { Contract } from 'web3-eth-contract'
import type { BigNumber } from 'bignumber.js'
import { Logger } from '@shapeshiftoss/logger'
import { toAssetId } from '@shapeshiftoss/caip'
import { KnownChainIds } from '@shapeshiftoss/types'
import { bnOrZero, normalizeAmount, toPath } from './utils'
import type { ChainAdapter } from '@shapeshiftoss/chain-adapters'
import { bip32ToAddressNList, ETHSignTx, HDWallet } from '@shapeshiftoss/hdwallet-core'
import { IdleVault, erc20Abi, idleTokenV4Abi, ssRouterContractAddress, MAX_ALLOWANCE } from './constants'

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
  slow: 0.5
})

type IdleOpportunityDeps = {
  chainAdapter: ChainAdapter<KnownChainIds.EthereumMainnet>
  dryRun?: true
  contract: Contract
  network?: number
  logger?: Logger
  web3: Web3
}

export class IdleOpportunity implements InvestorOpportunity
  <PreparedTransaction, any>,
  ApprovalRequired<PreparedTransaction>
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
      network: deps.network
    }

    // this.metadata = vault.metadata
    this.id = toLower(vault.address)
    this.metadata = {
      ...vault,
      apy:{
        net_apy:parseFloat(bnOrZero(vault.apr).div(100).toFixed())
      }
    };
    this.version = '';
    this.name = vault.poolName
    this.displayName = vault.poolName
    this.isNew = false;
    this.expired = false;
    this.apy = bnOrZero(vault.apr).div(100)
    this.tvl = {
      balanceUsdc: normalizeAmount(vault.tvl,6),
      balance: normalizeAmount(vault.underlyingTVL),
      assetId: toAssetId({
        chainId: 'eip155:1',
        assetNamespace: 'erc20',
        assetReference: vault.address
      })
    }
    this.underlyingAsset = {
      balance: bnOrZero(0),
      assetId: toAssetId({
        chainId: 'eip155:1',
        assetNamespace: 'erc20',
        assetReference: vault.underlyingAddress
      })
    }
    this.positionAsset = {
      balance: bnOrZero(0),
      assetId: toAssetId({
        chainId: 'eip155:1',
        assetNamespace: 'erc20',
        assetReference: vault.address
      }),
      underlyingPerPosition: normalizeAmount(vault.pricePerShare)
    }
    this.feeAsset = {
      assetId: 'eip155:1/slip44:60'
    }
  }

  private checksumAddress(address: string): string {
    return this.#internals.web3.utils.toChecksumAddress(address)
  }

  /**
   * From the token contract address and vault address, we need to get the vault id. The router
   * contract needs the vault id to know which vault it is dealing with when depositing, since it
   * takes a token address and a vault id.
   */
  private async getVaultId({
    underlyingAssetAddress,
    vaultAddress
  }: {
    underlyingAssetAddress: string
    vaultAddress: string
  }): Promise<number> {
    const numVaults = await this.#internals.routerContract.methods
      .numVaults(this.checksumAddress(underlyingAssetAddress))
      .call()
    let id: number | null = null
    for (let i = 0; i <= numVaults && isNil(id); i++) {
      const result = await this.#internals.routerContract.methods
        .vaults(this.checksumAddress(underlyingAssetAddress), i)
        .call()
      if (result === this.checksumAddress(vaultAddress)) id = i
    }
    if (isNil(id))
      throw new Error(
        `Could not find vault id for token: ${underlyingAssetAddress} vault: ${vaultAddress}`
      )
    return id
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
    const vaultContract: Contract = new this.#internals.web3.eth.Contract(idleTokenV4Abi, this.id)

    const preWithdraw = await vaultContract.methods.redeemIdleToken(amount.toString())
    const data = await preWithdraw.encodeABI({ from: address })
    const estimatedGas = bnOrZero(await preWithdraw.estimateGas({ from: address }))

    const nonce = await this.#internals.web3.eth.getTransactionCount(address)
    const gasPrice = bnOrZero(await this.#internals.web3.eth.getGasPrice())

    return {
      chainId: 1,
      data,
      estimatedGas,
      gasPrice,
      nonce: String(nonce),
      to: this.id,
      value: '0'
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
    const tokenChecksum = this.#internals.web3.utils.toChecksumAddress(
      this.id
    )
    const userChecksum = this.#internals.web3.utils.toChecksumAddress(address)
    const vaultIndex = await this.getVaultId({
      underlyingAssetAddress: this.metadata.underlyingAddress,
      vaultAddress: this.metadata.address
    })

    const preDeposit = await this.#internals.routerContract.methods.mintIdleToken(
      tokenChecksum,
      userChecksum,
      amount.toString(),
      vaultIndex
    )
    const data = await preDeposit.encodeABI({ from: address })
    const estimatedGas = bnOrZero(await preDeposit.estimateGas({ from: address }))

    const nonce = await this.#internals.web3.eth.getTransactionCount(address)
    const gasPrice = bnOrZero(await this.#internals.web3.eth.getGasPrice())

    return {
      chainId: 1,
      data,
      estimatedGas,
      gasPrice,
      nonce: String(nonce),
      to: ssRouterContractAddress,
      value: '0'
    }
  }

  public async allowance(address: string): Promise<BigNumber> {
    const depositTokenContract: Contract = new this.#internals.web3.eth.Contract(
      erc20Abi,
      this.id
    )
    const allowance = await depositTokenContract.methods
      .allowance(address, this.id)
      .call()

    return bnOrZero(allowance)
  }

  async prepareApprove(address: string): Promise<PreparedTransaction> {
    const depositTokenContract = new this.#internals.web3.eth.Contract(
      erc20Abi,
      this.id
    )
    const preApprove = await depositTokenContract.methods.approve(
      address,
      MAX_ALLOWANCE
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
      to: this.id,
      value: '0'
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
      addressNList
    }

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
}
