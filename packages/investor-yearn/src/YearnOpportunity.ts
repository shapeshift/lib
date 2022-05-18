import { JsonRpcProvider } from '@ethersproject/providers'
import { adapters } from '@shapeshiftoss/caip'
import type { ChainAdapter } from '@shapeshiftoss/chain-adapters/*'
import { ApprovalRequired, Fee, InvestorOpportunity, WithdrawInput } from '@shapeshiftoss/investor'
import { Logger } from '@shapeshiftoss/logger'
import type { ChainTypes } from '@shapeshiftoss/types'
import { type ChainId, type Vault, type VaultMetadata, Yearn, FeesInterface } from '@yfi/sdk'
import type { BigNumber } from 'bignumber.js'
import Web3 from 'web3'
import { HttpProvider } from 'web3-core'
import { Contract } from 'web3-eth-contract'
import { ETHSignTx } from '@shapeshiftoss/hdwallet-core'

import { ssRouterAbi, ssRouterContractAddress, yv2VaultAbi } from './constants'
import { buildTxToSign } from './utils'
import { bnOrZero } from './utils/bignumber'
import { DepositWithdrawArgs } from 'packages/investor/dist/InvestorOpportunity'

type YearnOpportunityDeps = {
  contract: Contract
  dryRun?: true
  logger?: Logger
  web3: Web3
  yearnSdk: Yearn<1>
}

export class YearnOpportunity implements InvestorOpportunity<ETHSignTx, VaultMetadata>, ApprovalRequired {
  readonly #internals: {
    routerContract: Contract
    dryRun?: true
    logger?: Logger
    vault: Vault,
    web3: Web3,
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

  async signAndBroadcast({ wallet, chainAdapter }: { wallet: ETHWallet, chainAdapter: ChainAdapter }, tx: PreparedTransaction): Promise<void> {
    if (wallet.supportsOfflineSigning()) {
      const signedTx = await chainAdapter.signTransaction({ tx, wallet })
      if (this.#internals.dryRun) return signedTx
      return chainAdapter.broadcastTransaction(signedTx)
    } else if (
      wallet.supportsBroadcast() &&
      chainAdapter.signAndBroadcastTransaction
    ) {
      if (this.#internals.dryRun) {
        throw new Error(`Cannot perform a dry run with wallet of type ${wallet.getVendor()}`)
      }
      return chainAdapter.signAndBroadcastTransaction({ tx, wallet })
    } else {
      throw new Error('Invalid HDWallet configuration ')
    }
  }

  async deposit(input: DepositWithdrawArgs): Promise<PreparedTransaction> {
    return Promise.resolve(undefined)
  }

  async prepareWithdrawal(input: DepositWithdrawArgs): Promise<PreparedTransaction> {
    const { wallet, amount, address } = input
    // We use the vault directly to withdraw the vault tokens. There is no benefit to the DAO to use
    // the router to withdraw funds and there is an extra approval required for the user if we
    // withdrew from the vault using the shapeshift router. Affiliate fees for SS are the same
    // either way. For this reason, we simply withdraw from the vault directly.
    const vaultContract: Contract = new Contract(yv2VaultAbi, this.id)

    const preWithdraw = await vaultContract.methods.withdraw(amountDesired.toString(), userAddress)
    const data = await preWithdraw.encodeABI({ from: userAddress })
    const estimatedGas = await preWithdraw.estimateGas({       from: userAddress      })

    const nonce = await this.#internals.web3.eth.getTransactionCount(address)
    const gasPrice = await this.#internals.web3.eth.getGasPrice()

    const txToSign = buildTxToSign({
      bip44Params: input.chainAdapter.buildBIP44Params({ accountNumber: 0 }),
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

  public allowance(address: string): Promise<unknown> {
    return Promise.resolve(undefined)
  }

  public approve(input: ApproveInput): Promise<unknown> {
    return Promise.resolve(undefined)
  }

}
