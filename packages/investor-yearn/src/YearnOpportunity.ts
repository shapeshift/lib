import { adapters } from '@shapeshiftoss/caip'
import type { ChainAdapter } from '@shapeshiftoss/chain-adapters'
import { bip32ToAddressNList, ETHSignTx, ETHWallet } from '@shapeshiftoss/hdwallet-core'
import {
  ApprovalRequired,
  DepositWithdrawArgs,
  Fee,
  InvestorOpportunity
} from '@shapeshiftoss/investor'
import { Logger } from '@shapeshiftoss/logger'
import { ChainTypes } from '@shapeshiftoss/types'
import { type ChainId, type Vault, type VaultMetadata, Yearn } from '@yfi/sdk'
import type { BigNumber } from 'bignumber.js'
import isNil from 'lodash/isNil'
import omit from 'lodash/omit'
import Web3 from 'web3'
import { Contract } from 'web3-eth-contract'
import { numberToHex } from 'web3-utils'

import { erc20Abi, MAX_ALLOWANCE, ssRouterContractAddress, yv2VaultAbi } from './constants'
import { buildTxToSign, toPath } from './utils'
import { bnOrZero } from './utils/bignumber'

type YearnOpportunityDeps = {
  contract: Contract
  dryRun?: true
  logger?: Logger
  web3: Web3
  yearnSdk: Yearn<1>
}

export type PreparedTransaction = Omit<
  ETHSignTx,
  'addressNList' | 'maxFeePerGas' | 'maxPriorityFeePerGas' | 'gasPrice'
> & {
  gasPrice: BigNumber
  feePriority?: Fee
}

const feeMultipier: Record<Fee, number> = Object.freeze({
  [Fee.High]: 1,
  [Fee.Medium]: 0.8,
  [Fee.Low]: 0.5
})

export class YearnOpportunity
  implements
    InvestorOpportunity<ChainTypes.Ethereum, PreparedTransaction, VaultMetadata>,
    ApprovalRequired
{
  readonly #internals: {
    routerContract: Contract
    dryRun?: true
    logger?: Logger
    vault: Vault
    web3: Web3
    yearn: Yearn<ChainId>
  }
  public readonly apr: BigNumber
  public readonly displayName: string
  public readonly id: string
  public readonly isApprovalRequired: true
  public readonly metadata: VaultMetadata
  public readonly underlyingAsset: { assetId: string; balance: BigNumber }
  public readonly positionAsset: { assetId: string; balance: BigNumber; price: BigNumber }
  public readonly price: BigNumber
  public readonly supply: BigNumber
  public readonly tvl: {
    assetBalance: BigNumber
    usdcBalance?: BigNumber
  }

  constructor(deps: YearnOpportunityDeps, vault: Vault) {
    this.#internals = {
      dryRun: deps.dryRun,
      routerContract: deps.contract,
      logger: deps.logger ?? new Logger({ name: 'Yearn Opportunity' }),
      yearn: deps.yearnSdk,
      web3: deps.web3,
      vault
    }

    this.id = vault.address
    this.metadata = vault.metadata
    this.displayName = vault.metadata.displayName || vault.name
    this.apr = bnOrZero(vault.metadata.apy?.net_apy)
    // @TODO TotalSupply from the API awas 0
    this.supply = bnOrZero(vault.metadata.totalSupply)
    this.tvl = {
      assetBalance: bnOrZero(vault.underlyingTokenBalance.amount),
      usdcBalance: bnOrZero(vault.underlyingTokenBalance.amountUsdc)
    }
    this.underlyingAsset = {
      balance: bnOrZero(0),
      assetId: adapters.yearnToAssetId(vault.tokenId || vault.token)
    }
    this.positionAsset = {
      balance: bnOrZero(0),
      assetId: adapters.yearnToAssetId(vault.address),
      price: bnOrZero(vault.metadata.pricePerShare)
    }
  }

  // private async update() {
  //   // re-fetch data and update state
  //   const contract = new this.#internals.web3.eth.Contract(yv2VaultAbi, this.id)
  //   const pricePerShare = await contract.methods.pricePerShare().call()
  //   return bnOrZero(pricePerShare)
  //   const totalSupply = await contract.methods.totalSupply().call()
  //   return bnOrZero(totalSupply)
  //   const positionBalance = await contract.methods.balanceOf(userAddress).call()
  //   return bnOrZero(positionBalance)
  // }

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

  async signAndBroadcast(
    deps: { wallet: ETHWallet; chainAdapter: ChainAdapter<ChainTypes.Ethereum> },
    preparedTx: PreparedTransaction
  ): Promise<string> {
    if (!preparedTx.feePriority) throw new Error('Missing feePriority')
    const wallet = deps.wallet

    // We must have an Ethereum ChainAdapter
    const chainAdapter = deps.chainAdapter

    const path = toPath(chainAdapter.buildBIP44Params({ accountNumber: 0 }))
    const addressNList = bip32ToAddressNList(path)
    const gasPrice = numberToHex(
      bnOrZero(preparedTx.gasPrice).times(feeMultipier[preparedTx.feePriority]).toString()
    )
    const txToSign: ETHSignTx = {
      ...omit(preparedTx, ['feePriority', 'gasPrice']),
      addressNList,
      gasPrice
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
      throw new Error('Invalid HDWallet configuration ')
    }
  }

  async prepareDeposit(input: DepositWithdrawArgs): Promise<PreparedTransaction> {
    const { address, amount } = input

    // In order to properly earn affiliate revenue, we must deposit to the vault through the SS
    // router contract. This is not necessary for withdraws. We can withdraw directly from the vault
    // without affecting the DAOs affiliate revenue.
    const tokenChecksum = this.#internals.web3.utils.toChecksumAddress(
      this.#internals.vault.tokenId
    )
    const userChecksum = this.#internals.web3.utils.toChecksumAddress(address)
    // TODO(theobold): implment getVaultId function
    const vaultIndex = await this.getVaultId({
      underlyingAssetAddress: this.#internals.vault.tokenId,
      vaultAddress: this.#internals.vault.address
    })

    const preWithdraw = await this.#internals.routerContract.methods.deposit(
      tokenChecksum,
      userChecksum,
      amount.toString(),
      vaultIndex
    )
    const data = await preWithdraw.encodeABI({ from: address })
    const estimatedGas = bnOrZero(await preWithdraw.estimateGas({ from: address }))

    const nonce = await this.#internals.web3.eth.getTransactionCount(address)
    const gasPrice = bnOrZero(await this.#internals.web3.eth.getGasPrice())

    return buildTxToSign({
      chainId: 1,
      data,
      estimatedGas,
      gasPrice,
      nonce: String(nonce),
      to: this.id,
      value: '0'
    })
  }

  async prepareWithdrawal(input: DepositWithdrawArgs): Promise<PreparedTransaction> {
    const { address, amount } = input
    // We use the vault directly to withdraw the vault tokens. There is no benefit to the DAO to use
    // the router to withdraw funds and there is an extra approval required for the user if we
    // withdrew from the vault using the shapeshift router. Affiliate fees for SS are the same
    // either way. For this reason, we simply withdraw from the vault directly.
    const vaultContract: Contract = new this.#internals.web3.eth.Contract(yv2VaultAbi, this.id)

    const preWithdraw = await vaultContract.methods.withdraw(amount.toString(), address)
    const data = await preWithdraw.encodeABI({ from: address })
    const estimatedGas = bnOrZero(await preWithdraw.estimateGas({ from: address }))

    const nonce = await this.#internals.web3.eth.getTransactionCount(address)
    const gasPrice = bnOrZero(await this.#internals.web3.eth.getGasPrice())

    return buildTxToSign({
      chainId: 1,
      data,
      estimatedGas,
      gasPrice,
      nonce: String(nonce),
      to: this.id,
      value: '0'
    })
  }

  public allowance(address: string): Promise<string> {
    const depositTokenContract: Contract = new this.#internals.web3.eth.Contract(
      erc20Abi,
      this.#internals.vault.tokenId
    )
    return depositTokenContract.methods
      .allowance(address, this.#internals.routerContract.options.address)
      .call()
  }

  async prepareApprove(address: string): Promise<PreparedTransaction> {
    const depositTokenContract = new this.#internals.web3.eth.Contract(
      erc20Abi,
      this.#internals.vault.tokenId
    )
    const preApprove = await depositTokenContract.methods.approve(
      ssRouterContractAddress,
      MAX_ALLOWANCE
    )
    const data = await preApprove.encodeABI({ from: address })
    const estimatedGas = bnOrZero(await preApprove.estimateGas({ from: address }))

    const nonce: number = await this.#internals.web3.eth.getTransactionCount(address)
    const gasPrice = bnOrZero(await this.#internals.web3.eth.getGasPrice())

    return buildTxToSign({
      chainId: 1,
      data,
      estimatedGas,
      gasPrice,
      nonce: String(nonce),
      to: this.#internals.vault.tokenId,
      value: '0'
    })
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
      apr: this.apr.toString(),
      // @TODO TotalSupply from the API awas 0
      supply: this.supply.toString(),
      tvl: {
        assetBalance: this.tvl.assetBalance.toString(),
        usdcBalance: this.tvl.usdcBalance?.toString()
      },
      underlyingAsset: {
        balance: this.underlyingAsset.balance.toString(),
        assetId: this.underlyingAsset.assetId
      },
      positionAsset: {
        balance: this.positionAsset.balance.toString(),
        assetId: this.positionAsset.assetId,
        price: this.positionAsset.price.toString()
      }
    }
  }
}
