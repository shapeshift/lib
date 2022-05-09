import { adapters } from '@shapeshiftoss/caip'
import { ApprovalRequired, InvestorOpportunity } from '@shapeshiftoss/investor/src'
import { Vault, VaultMetadata } from '@yfi/sdk'
import { BigNumber } from 'bignumber.js'

import { ssRouterAbi, ssRouterContractAddress, yv2VaultAbi } from './constants'
import { buildTxToSign } from './utils'
import { bnOrZero } from './utils/bignumber'

export class YearnOpportunity implements InvestorOpportunity<VaultMetadata>, ApprovalRequired {
  private readonly _vault: Vault

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

  constructor(vault: Vault) {
    this.adapter = adapter
    this.provider = new Web3.providers.HttpProvider(providerUrl)
    this.jsonRpcProvider = new JsonRpcProvider(providerUrl)
    this.web3 = new Web3(this.provider)
    this.yearnSdk = new Yearn(network, { provider: this.jsonRpcProvider })
    this.ssRouterContract = new this.web3.eth.Contract(ssRouterAbi, ssRouterContractAddress)

    this._vault = vault
    this.id = vault.address
    this.metadata = vault.metadata
    this.displayName = vault.metadata.displayName || vault.name
    this.apr = bnOrZero(vault.metadata.apy?.net_apy)
    this.supply = bnOrZero(vault.metadata.totalSupply)
    this.tvl = bnOrZero(vault.metadata.totalAssets)
    this.price = bnOrZero(vault.metadata.pricePerShare)
    this.underlyingAsset = {
      balance: new BigNumber(vault.underlyingTokenBalance.amount),
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
    const nonce = await this.web3.eth.getTransactionCount(address)
    const gasPrice = await this.web3.eth.getGasPrice()

    const txToSign = buildTxToSign({
      bip44Params: this.adapter.buildBIP44Params({ accountNumber: 0 }),
      chainId: 1,
      data,
      estimatedGas: estimatedGas.toString(),
      gasPrice,
      nonce: String(nonce),
      to: this._vault.address,
      value: '0'
    })
    if (wallet.supportsOfflineSigning()) {
      const signedTx = await this.adapter.signTransaction({ txToSign, wallet })
      if (dryRun) return signedTx
      return this.adapter.broadcastTransaction(signedTx)
    } else if (wallet.supportsBroadcast() && this.adapter.signAndBroadcastTransaction) {
      if (dryRun) {
        throw new Error(`Cannot perform a dry run with wallet of type ${wallet.getVendor()}`)
      }
      return this.adapter.signAndBroadcastTransaction({ txToSign, wallet })
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
