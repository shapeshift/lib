import { AssetId, ethChainId, toAssetId } from '@shapeshiftoss/caip'
import { ChainAdapter, toAddressNList } from '@shapeshiftoss/chain-adapters'
import { ETHSignTx, HDWallet } from '@shapeshiftoss/hdwallet-core'
import { DepositWithdrawArgs, FeePriority, InvestorOpportunity } from '@shapeshiftoss/investor'
import { Logger } from '@shapeshiftoss/logger'
import { BIP44Params, KnownChainIds } from '@shapeshiftoss/types'
import type { BigNumber } from 'bignumber.js'
import toLower from 'lodash/toLower'
import { numberToHex } from 'web3-utils'

import { OsmosisPool } from './constants'
import { bn, bnOrZero } from './utils'

export type PreparedTransaction = {
  chainId: number
  data: string
  estimatedGas: BigNumber
  gasPrice: BigNumber
  nonce: string
  to: string
  value: '0'
}

const feeMultiplier: Record<FeePriority, number> = Object.freeze({
  fast: 1,
  average: 0.8,
  slow: 0.5,
})

type OsmosisOpportunityDeps = {
  chainAdapter: ChainAdapter<KnownChainIds.OsmosisMainnet>
  dryRun?: true
  logger?: Logger
}

export type ClaimableToken = {
  assetId: string
  address: string
  amount: number
}

interface OsmosisClaimableOpportunity {
  getClaimableTokens(address: string): Promise<ClaimableToken[]>
}

export class OsmosisOpportunity
  implements InvestorOpportunity<PreparedTransaction, OsmosisPool>, OsmosisClaimableOpportunity
{
  readonly #internals: {
    chainAdapter: ChainAdapter<KnownChainIds.OsmosisMainnet>
    dryRun?: true
    logger?: Logger
    network?: number
  }

  /**
   * Opportunity id e.g., contract address or validator address
   */
  readonly id: string
  readonly version: string
  readonly name: string
  readonly displayName: string
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
  readonly metadata: OsmosisPool
  readonly isNew: boolean
  readonly expired: boolean

  constructor(deps: OsmosisOpportunityDeps, pool: OsmosisPool) {
    this.#internals = {
      chainAdapter: deps.chainAdapter,
      dryRun: deps.dryRun,
      logger: deps.logger ?? new Logger({ name: 'Osmosis Opportunity' }),
    }

    // this.metadata = pool.metadata
    this.id = toLower(pool.address)
    this.metadata = {
      ...pool,
      apy: {
        net_apy: parseFloat(bnOrZero(pool.apr).div(100).toFixed()),
      },
    }
    this.version = `${pool.protocolName} ${pool.strategy}`.trim()
    this.name = pool.poolName
    this.displayName = pool.poolName
    this.isNew = false
    this.expired = false
    this.apy = bnOrZero(pool.apr).div(100)
    this.tvl = {
      balanceUsdc: bnOrZero(pool.tvl),
      balance: bnOrZero(pool.underlyingTVL),
      assetId: toAssetId({
        chainId: 'cosmos:osmosis-1',
        assetNamespace: 'erc20',
        assetReference: pool.address,
      }),
    }
    this.underlyingAsset = {
      balance: bn(0),
      assetId: toAssetId({
        chainId: 'eip155:1',
        assetNamespace: 'erc20',
        assetReference: pool.underlyingAddress,
      }),
    }
    this.positionAsset = {
      balance: bn(0),
      assetId: toAssetId({
        chainId: 'eip155:1',
        assetNamespace: 'erc20',
        assetReference: pool.address,
      }),
      underlyingPerPosition: bnOrZero(pool.pricePerShare),
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
    // We use the pool directly to withdraw the pool tokens. There is no benefit to the DAO to use
    // the router to withdraw funds and there is an extra approval required for the user if we
    // withdrew from the pool using the shapeshift router. Affiliate fees for SS are the same
    // either way. For this reason, we simply withdraw from the pool directly.

    let methodName: string
    let poolContract: Contract

    // Handle Tranche Withdraw
    if (this.metadata.cdoAddress) {
      poolContract = new this.#internals.web3.eth.Contract(osmosisCdoAbi, this.metadata.cdoAddress)
      const trancheType = /senior/i.test(this.metadata.strategy) ? 'AA' : 'BB'
      methodName = `withdraw${trancheType}`
    } else {
      poolContract = new this.#internals.web3.eth.Contract(osmosisTokenV4Abi, this.id)
      methodName = `redeemOsmosisToken`
    }

    const preWithdraw = await poolContract.methods[methodName](amount.toFixed())

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
      to: poolContract.options.address,
      value: '0',
    }
  }

  public async prepareClaimTokens(address: string): Promise<PreparedTransaction> {
    const poolContract = new this.#internals.web3.eth.Contract(osmosisTokenV4Abi, this.id)

    const preWithdraw = await poolContract.methods.redeemOsmosisToken(0)

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
      to: poolContract.options.address,
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

    // In order to properly earn affiliate revenue, we must deposit to the pool through the SS
    // router contract. This is not necessary for withdraws. We can withdraw directly from the pool
    // without affecting the DAOs affiliate revenue.

    let methodName: string
    let methodParams: string[]
    let poolContract: Contract

    // Handle Tranche Deposit
    if (this.metadata.cdoAddress) {
      poolContract = this.#internals.routerContract
      const trancheType = /senior/i.test(this.metadata.strategy) ? 'AA' : 'BB'
      methodName = `deposit${trancheType}`
      methodParams = [this.metadata.cdoAddress, amount.toFixed()]
    } else {
      methodName = 'mintOsmosisToken'
      methodParams = [amount.toFixed(), 'true', referralAddress]
      poolContract = new this.#internals.web3.eth.Contract(osmosisTokenV4Abi, this.id)
    }

    const preDeposit = await poolContract.methods[methodName](...methodParams)

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
      to: poolContract.options.address,
      value: '0',
    }
  }

  async getRewardAssetIds(): Promise<AssetId[]> {
    let govTokens = []

    if (this.metadata.cdoAddress) {
      const cdoContract: Contract = new this.#internals.web3.eth.Contract(
        osmosisCdoAbi,
        this.metadata.cdoAddress,
      )
      const strategyContractAddress: string = await cdoContract.methods.strategy().call()
      const strategyContract = new this.#internals.web3.eth.Contract(
        osmosisStrategyAbi,
        strategyContractAddress,
      )
      govTokens = await strategyContract.methods.getRewardTokens().call()
    } else {
      const poolContract: Contract = new this.#internals.web3.eth.Contract(
        osmosisTokenV4Abi,
        this.id,
      )
      govTokens = await poolContract.methods.getGovTokens().call()
    }

    const rewardAssetIds = govTokens.map((token: string) =>
      toAssetId({
        assetNamespace: 'erc20',
        assetReference: token,
        chainId: ethChainId,
      }),
    )

    return rewardAssetIds
  }

  /**
   * Prepare an unsigned deposit transaction
   *
   * @param address - The user's wallet address where the funds are
   */
  async getClaimableTokens(address: string): Promise<ClaimableToken[]> {
    if (this.metadata.cdoAddress) {
      return []
    }

    const claimableTokens: ClaimableToken[] = []
    const poolContract: Contract = new this.#internals.web3.eth.Contract(osmosisTokenV4Abi, this.id)
    const govTokensAmounts = await poolContract.methods.getGovTokensAmounts(address).call()

    for (let i = 0; i < govTokensAmounts.length; i++) {
      const govTokenAddress = await poolContract.methods.govTokens(i).call()

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

    return claimableTokens
  }

  /**
   * Sign and broadcast a previously prepared transaction
   */
  async signAndBroadcast(input: {
    wallet: HDWallet
    tx: PreparedTransaction
    feePriority?: FeePriority
    bip44Params: BIP44Params
  }): Promise<string> {
    const { wallet, tx, feePriority, bip44Params } = input
    const feeSpeed: FeePriority = feePriority ? feePriority : 'fast'
    const chainAdapter = this.#internals.chainAdapter

    const gasPrice = numberToHex(bnOrZero(tx.gasPrice).times(feeMultiplier[feeSpeed]).toString())
    const txToSign: ETHSignTx = {
      ...tx,
      gasPrice,
      // Gas limit safety factor of 50% to prevent out of gas errors on chain.
      gasLimit: numberToHex(tx.estimatedGas.times(1.5).integerValue().toString()),
      nonce: numberToHex(tx.nonce),
      value: numberToHex(tx.value),
      addressNList: toAddressNList(bip44Params),
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
        price: this.positionAsset.underlyingPerPosition.toFixed(),
      },
    }
  }
}
