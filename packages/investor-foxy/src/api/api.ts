import { JsonRpcProvider } from '@ethersproject/providers'
import { ChainAdapter } from '@shapeshiftoss/chain-adapters'
import { ChainTypes } from '@shapeshiftoss/types'
import { BigNumber } from 'bignumber.js'
import { toLower } from 'lodash'
import Web3 from 'web3'
import { HttpProvider, TransactionReceipt } from 'web3-core/types'
import { Contract } from 'web3-eth-contract'

import { erc20Abi, foxyAbi, foxyStakingContractAddress, MAX_ALLOWANCE } from '../constants'
import { bnOrZero, buildTxToSign } from '../utils'
import {
  Allowanceinput,
  ApproveInput,
  APYInput,
  BalanceInput,
  EstimateGasApproveInput,
  EstimateGasTxInput,
  TxInput
} from './foxy-types'

export type ConstructorArgs = {
  adapter: ChainAdapter<ChainTypes.Ethereum>
  providerUrl: string
  network?: 1 | 250 | 1337 | 42161 // 1: 'ethereum', 250: 'fantom', 1337: 'ethereum', 42161: 'arbitrum'
}

export class FoxyApi {
  public adapter: ChainAdapter<ChainTypes.Ethereum>
  public provider: HttpProvider
  public jsonRpcProvider: JsonRpcProvider
  public web3: Web3
  private foxyStakingContract: Contract

  constructor({ adapter, providerUrl, network = 1 }: ConstructorArgs) {
    this.adapter = adapter
    this.provider = new Web3.providers.HttpProvider(providerUrl)
    this.jsonRpcProvider = new JsonRpcProvider(providerUrl)
    this.web3 = new Web3(this.provider)
    this.foxyStakingContract = new this.web3.eth.Contract(foxyAbi, foxyStakingContractAddress)
  }

  async getGasPrice() {
    const gasPrice = await this.web3.eth.getGasPrice()
    return bnOrZero(gasPrice)
  }

  async getTxReceipt({ txid }: { txid: string }): Promise<TransactionReceipt> {
    return await this.web3.eth.getTransactionReceipt(txid)
  }

  checksumAddress(address: string): string {
    return this.web3.utils.toChecksumAddress(address)
  }

  async estimateApproveGas(input: EstimateGasApproveInput): Promise<BigNumber> {
    const { userAddress, tokenContractAddress } = input
    const depositTokenContract = new this.web3.eth.Contract(erc20Abi, tokenContractAddress)
    const estimatedGas = await depositTokenContract.methods
      .approve(foxyStakingContractAddress, MAX_ALLOWANCE)
      .estimateGas({
        from: userAddress
      })
    return bnOrZero(estimatedGas)
  }

  async approve(input: ApproveInput): Promise<string> {
    const { accountNumber = 0, dryRun = false, tokenContractAddress, userAddress, wallet } = input
    if (!wallet) throw new Error('Missing inputs')
    const estimatedGas: BigNumber = await this.estimateApproveGas(input)
    const depositTokenContract = new this.web3.eth.Contract(erc20Abi, tokenContractAddress)
    const data: string = depositTokenContract.methods
      .approve(foxyStakingContractAddress, MAX_ALLOWANCE)
      .encodeABI({
        from: userAddress
      })
    const nonce: number = await this.web3.eth.getTransactionCount(userAddress)
    const gasPrice: string = await this.web3.eth.getGasPrice()

    const txToSign = buildTxToSign({
      bip44Params: this.adapter.buildBIP44Params({ accountNumber }),
      chainId: 1,
      data,
      estimatedGas: estimatedGas.toString(),
      gasPrice,
      nonce: String(nonce),
      to: tokenContractAddress,
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

  async allowance(input: Allowanceinput): Promise<string> {
    const { userAddress, tokenContractAddress } = input
    const depositTokenContract: Contract = new this.web3.eth.Contract(
      erc20Abi,
      tokenContractAddress
    )
    return depositTokenContract.methods.allowance(userAddress, foxyStakingContractAddress).call()
  }

  async estimateDepositGas(input: EstimateGasTxInput): Promise<BigNumber> {
    throw new Error('Not implemented')
  }

  async deposit(input: TxInput): Promise<string> {
    const {
      amountDesired,
      accountNumber = 0,
      dryRun = false,
      contractAddress,
      userAddress,
      wallet
    } = input
    if (!wallet || !contractAddress) throw new Error('Missing inputs')
    const estimatedGas: BigNumber = await this.estimateDepositGas(input)

    const userChecksum = this.web3.utils.toChecksumAddress(userAddress)
    const data: string = await this.foxyStakingContract.methods
      .stake(amountDesired.toString())
      .encodeABI({
        value: 0,
        from: userChecksum
      })
    const nonce = await this.web3.eth.getTransactionCount(userAddress)
    const gasPrice = await this.web3.eth.getGasPrice()

    const txToSign = buildTxToSign({
      bip44Params: this.adapter.buildBIP44Params({ accountNumber }),
      chainId: 1,
      data,
      estimatedGas: estimatedGas.toString(),
      gasPrice,
      nonce: String(nonce),
      to: foxyStakingContractAddress,
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

  async estimateWithdrawGas(input: EstimateGasTxInput): Promise<BigNumber> {
    const { amountDesired, userAddress } = input
    const estimatedGas = await this.foxyStakingContract.methods
      .unstake(amountDesired.toString(), userAddress)
      .estimateGas({
        from: userAddress
      })
    return bnOrZero(estimatedGas)
  }

  async withdraw(input: TxInput): Promise<string> {
    const {
      amountDesired,
      accountNumber = 0,
      dryRun = false,
      contractAddress,
      userAddress,
      wallet
    } = input
    if (!wallet || !contractAddress) throw new Error('Missing inputs')
    const estimatedGas: BigNumber = await this.estimateWithdrawGas(input)

    const data: string = this.foxyStakingContract.methods
      .unstake(amountDesired.toString(), true)
      .encodeABI({
        from: userAddress
      })
    const nonce = await this.web3.eth.getTransactionCount(userAddress)
    const gasPrice = await this.web3.eth.getGasPrice()

    const txToSign = buildTxToSign({
      bip44Params: this.adapter.buildBIP44Params({ accountNumber }),
      chainId: 1,
      data,
      estimatedGas: estimatedGas.toString(),
      gasPrice,
      nonce: String(nonce),
      to: foxyStakingContractAddress,
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

  async instantWithdraw(input: TxInput): Promise<string> {
    const { accountNumber = 0, dryRun = false, contractAddress, userAddress, wallet } = input
    if (!wallet || !contractAddress) throw new Error('Missing inputs')
    const estimatedGas: BigNumber = await this.estimateWithdrawGas(input)

    const data: string = this.foxyStakingContract.methods.instantUnstake(true).encodeABI({
      from: userAddress
    })
    const nonce = await this.web3.eth.getTransactionCount(userAddress)
    const gasPrice = await this.web3.eth.getGasPrice()

    const txToSign = buildTxToSign({
      bip44Params: this.adapter.buildBIP44Params({ accountNumber }),
      chainId: 1,
      data,
      estimatedGas: estimatedGas.toString(),
      gasPrice,
      nonce: String(nonce),
      to: foxyStakingContractAddress,
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

  async balance(input: BalanceInput): Promise<BigNumber> {
    const { contractAddress, userAddress } = input
    const contract = new this.web3.eth.Contract(erc20Abi, contractAddress)
    const balance = await contract.methods.balanceOf(userAddress).call()
    return bnOrZero(balance)
  }

  async totalSupply({ contractAddress }: { contractAddress: string }): Promise<BigNumber> {
    const contract = new this.web3.eth.Contract(erc20Abi, contractAddress)
    const totalSupply = await contract.methods.totalSupply().call()
    return bnOrZero(totalSupply)
  }

  async apy(input: APYInput): Promise<string> {
    return '.2'
  }
}
