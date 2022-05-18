import { JsonRpcProvider } from '@ethersproject/providers'
import { adapters } from '@shapeshiftoss/caip'
import type { ChainAdapter } from '@shapeshiftoss/chain-adapters/*'
import { ETHSignTx, ETHWallet } from '@shapeshiftoss/hdwallet-core'
import { ApprovalRequired, Fee, InvestorOpportunity, WithdrawInput } from '@shapeshiftoss/investor'
import { Logger } from '@shapeshiftoss/logger'
import type { ChainTypes } from '@shapeshiftoss/types'
import { type ChainId, type Vault, type VaultMetadata, FeesInterface,Yearn } from '@yfi/sdk'
import type { BigNumber } from 'bignumber.js'
import { DepositWithdrawArgs } from 'packages/investor/dist/InvestorOpportunity'
import Web3 from 'web3'
import { HttpProvider } from 'web3-core'
import { Contract } from 'web3-eth-contract'

import {
  erc20Abi,
  MAX_ALLOWANCE,
  ssRouterAbi,
  ssRouterContractAddress,
  yv2VaultAbi
} from './constants'
import { buildTxToSign } from './utils'
import { bnOrZero } from './utils/bignumber'

type YearnOpportunityDeps = {
  contract: Contract
  dryRun?: true
  logger?: Logger
  web3: Web3
  yearnSdk: Yearn<1>
}

export class YearnOpportunity
  implements InvestorOpportunity<ETHSignTx, VaultMetadata>, ApprovalRequired
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
  public readonly positionAsset: { assetId: string; balance: BigNumber, price: BigNumber }
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

  private async update() {
    // re-fetch data and update state
    const contract = new this.#internals.web3.eth.Contract(yv2VaultAbi, this.id)
    const pricePerShare = await contract.methods.pricePerShare().call()
    return bnOrZero(pricePerShare)
    const totalSupply = await contract.methods.totalSupply().call()
    return bnOrZero(totalSupply)
    const positionBalance = await contract.methods.balanceOf(userAddress).call()
    return bnOrZero(positionBalance)
  }

  async signAndBroadcast(
    { wallet, chainAdapter }: { wallet: ETHWallet; chainAdapter: ChainAdapter },
    tx: PreparedTransaction
  ): Promise<string> {
    if (wallet.supportsOfflineSigning()) {
      const signedTx = await chainAdapter.signTransaction({ tx, wallet })
      if (this.#internals.dryRun) return signedTx
      return chainAdapter.broadcastTransaction(signedTx)
    } else if (wallet.supportsBroadcast() && chainAdapter.signAndBroadcastTransaction) {
      if (this.#internals.dryRun) {
        throw new Error(`Cannot perform a dry run with wallet of type ${wallet.getVendor()}`)
      }
      return chainAdapter.signAndBroadcastTransaction({ tx, wallet })
    } else {
      throw new Error('Invalid HDWallet configuration ')
    }
  }

  async prepareDeposit(input: DepositWithdrawArgs): Promise<PreparedTransaction> {
    const { address, amount, chainAdapter } = input

    // In order to properly earn affiliate revenue, we must deposit to the vault through the SS
    // router contract. This is not necessary for withdraws. We can withdraw directly from the vault
    // without affecting the DAOs affiliate revenue.
    const tokenChecksum = this.#internals.web3.utils.toChecksumAddress(
      this.#internals.vault.tokenId
    )
    const userChecksum = this.#internals.web3.utils.toChecksumAddress(userAddress)
    // TODO(theobold): implment getVaultId function
    const vaultIndex = await this.getVaultId({ tokenContractAddress, vaultAddress })
    const preWithdraw = await this.#internals.routerContract.methods.deposit(
      tokenChecksum,
      userChecksum,
      amount.toString(),
      vaultIndex
    )
    const data = await preWithdraw.encodeABI({ from: userAddress })
    const estimatedGas = await preWithdraw.estimateGas({ from: userAddress })

    const nonce = await this.#internals.web3.eth.getTransactionCount(address)
    const gasPrice = await this.#internals.web3.eth.getGasPrice()

    return buildTxToSign({
      bip44Params: chainAdapter.buildBIP44Params({ accountNumber: 0 }),
      chainId: 1,
      data,
      estimatedGas: estimatedGas.toString(),
      gasPrice: {
        high: 1,
        mid: 0.5,
        low: 0
      },
      nonce: String(nonce),
      to: this.id,
      value: '0'
    })
  }

  async prepareWithdrawal(input: DepositWithdrawArgs): Promise<PreparedTransaction> {
    const { address, amount, chainAdapter } = input
    // We use the vault directly to withdraw the vault tokens. There is no benefit to the DAO to use
    // the router to withdraw funds and there is an extra approval required for the user if we
    // withdrew from the vault using the shapeshift router. Affiliate fees for SS are the same
    // either way. For this reason, we simply withdraw from the vault directly.
    const vaultContract: Contract = new Contract(yv2VaultAbi, this.id)

    const preWithdraw = await vaultContract.methods.withdraw(amount.toString(), userAddress)
    const data = await preWithdraw.encodeABI({ from: userAddress })
    const estimatedGas = await preWithdraw.estimateGas({ from: userAddress })

    const nonce = await this.#internals.web3.eth.getTransactionCount(address)
    const gasPrice = await this.#internals.web3.eth.getGasPrice()

    return buildTxToSign({
      bip44Params: chainAdapter.buildBIP44Params({ accountNumber: 0 }),
      chainId: 1,
      data,
      estimatedGas: estimatedGas.toString(),
      gasPrice: {
        high: 1,
        mid: 0.5,
        low: 0
      },
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
      .allowance(userAddress, this.#internals.routerContract)
      .call()
  }

  async prepareApprove(input: ApproveInput): Promise<PreparedTransaction> {
    const { address, chainAdapter } = input

    const depositTokenContract = new this.#internals.web3.eth.Contract(
      erc20Abi,
      this.#internals.vault.tokenId
    )
    const preApprove = await depositTokenContract.methods.approve(
      ssRouterContractAddress,
      MAX_ALLOWANCE
    )
    const data = await preApprove.encodeABI({ from: userAddress })
    const estimatedGas = await preApprove.estimateGas({ from: userAddress })

    const nonce: number = await this.#internals.web3.eth.getTransactionCount(userAddress)
    const gasPrice: string = await this.#internals.web3.eth.getGasPrice()

    return buildTxToSign({
      bip44Params: chainAdapter.buildBIP44Params({ accountNumber: 0 }),
      chainId: 1,
      data,
      estimatedGas: estimatedGas.toString(),
      gasPrice:  {
        high: 1,
        mid: 0.5,
        low: 0
      },
      nonce: String(nonce),
      to: this.#internals.vault.tokenId,
      value: '0'
    })
  }
}
