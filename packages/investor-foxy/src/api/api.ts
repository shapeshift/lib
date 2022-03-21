import { JsonRpcProvider } from '@ethersproject/providers'
import { ChainReference } from '@shapeshiftoss/caip/dist/caip2/caip2'
import { ChainAdapter } from '@shapeshiftoss/chain-adapters'
import { ChainTypes } from '@shapeshiftoss/types'
import { BigNumber } from 'bignumber.js'
import { toLower } from 'lodash'
import Web3 from 'web3'
import { HttpProvider, TransactionReceipt } from 'web3-core/types'
import { Contract } from 'web3-eth-contract'

import { DefiType, erc20Abi, foxyStakingAbi, MAX_ALLOWANCE, WithdrawType } from '../constants'
import { foxyAbi } from '../constants/foxy-abi'
import { liquidityReserveAbi } from '../constants/liquidity-reserve-abi'
import { bnOrZero, buildTxToSign } from '../utils'
import {
  AllowanceInput,
  ApproveInput,
  BalanceInput,
  ClaimWithdrawal,
  EstimateGasApproveInput,
  EstimateGasTxInput,
  FoxyAddressesType,
  FoxyOpportunityInputData,
  InstantUnstakeFeeInput,
  TokenAddressInput,
  TxInput,
  TxInputWithoutAmount,
  TxInputWithoutAmountAndWallet,
  TxReceipt,
  WithdrawInfo,
  WithdrawInput
} from './foxy-types'

export type ConstructorArgs = {
  adapter: ChainAdapter<ChainTypes>
  providerUrl: string
  foxyAddresses: FoxyAddressesType
  network?:
    | ChainReference.EthereumMainnet
    | ChainReference.EthereumRinkeby
    | ChainReference.EthereumRopsten
}

export const transformData = ({ tvl, apy, expired, ...contractData }: FoxyOpportunityInputData) => {
  return {
    type: DefiType.TokenStaking,
    provider: 'ShapeShift',
    version: '1',
    contractAddress: contractData.staking,
    rewardToken: contractData.foxy,
    stakingToken: contractData.fox,
    chain: ChainTypes.Ethereum,
    tvl,
    apy,
    expired
  }
}

export class FoxyApi {
  public adapter: ChainAdapter<ChainTypes>
  public provider: HttpProvider
  private providerUrl: string
  public jsonRpcProvider: JsonRpcProvider
  public web3: Web3
  private foxyStakingContracts: Contract[]
  private liquidityReserveContracts: Contract[]
  private network: ChainReference
  private foxyAddresses: FoxyAddressesType

  constructor({
    adapter,
    providerUrl,
    foxyAddresses,
    network = ChainReference.EthereumMainnet
  }: ConstructorArgs) {
    this.adapter = adapter
    this.provider = new Web3.providers.HttpProvider(providerUrl)
    this.jsonRpcProvider = new JsonRpcProvider(providerUrl)
    this.web3 = new Web3(this.provider)
    this.foxyStakingContracts = foxyAddresses.map(
      (addresses) => new this.web3.eth.Contract(foxyStakingAbi, addresses.staking)
    )
    this.liquidityReserveContracts = foxyAddresses.map(
      (addresses) => new this.web3.eth.Contract(liquidityReserveAbi, addresses.liquidityReserve)
    )
    this.network = network
    this.providerUrl = providerUrl
    this.foxyAddresses = foxyAddresses
  }

  private async broadcastTx(signedTx: string) {
    try {
      if (this.providerUrl.includes('localhost')) {
        const sendSignedTx = await this.web3.eth.sendSignedTransaction(signedTx)
        return sendSignedTx?.blockHash
      }
      return this.adapter.broadcastTransaction(signedTx)
    } catch (e) {
      throw new Error(`Failed to broadcast: ${e}`)
    }
  }

  checksumAddress(address: string): string {
    return this.web3.utils.toChecksumAddress(address)
  }

  verifyAddresses(addresses: string[]) {
    try {
      addresses.forEach((address) => {
        this.checksumAddress(address)
      })
    } catch (e) {
      throw new Error(`Verify Address: ${e}`)
    }
  }

  async getRebaseHistory(input: BalanceInput) {
    const { tokenContractAddress, userAddress } = input
    this.verifyAddresses([tokenContractAddress])

    const contract = new this.web3.eth.Contract(foxyAbi, tokenContractAddress)
    // const totalGons = await contract.methods.TOTAL_GONS();
    // console.log('total', totalGons)
    const events = contract.getPastEvents(
      'LogRebase',
      {
        fromBlock: 14381454, // genesis rebase
        toBlock: 'latest'
      },
      function (error, events) {
        console.log(events)
      }
    )
    
    let totalAmount = 0




    return events
  }

  async getFoxyOpportunities() {
    try {
      const opportunities = await Promise.all(
        this.foxyAddresses.map(async (addresses) => {
          const stakingContract = this.foxyStakingContracts.find(
            (item) => toLower(item.options.address) === toLower(addresses.staking)
          )
          const expired = await stakingContract?.methods.pauseStaking().call()
          const tvl = await this.tvl({ tokenContractAddress: addresses.foxy })
          const apy = this.apy()

          return transformData({ ...addresses, expired, tvl, apy })
        })
      )
      return opportunities
    } catch (e) {
      throw new Error(`getFoxyOpportunities Error: ${e}`)
    }
  }

  async getFoxyOpportunityByStakingAddress(stakingAddress: string) {
    this.verifyAddresses([stakingAddress])

    const addresses = this.foxyAddresses.find(async (item) => {
      return item.staking === stakingAddress
    })
    if (!addresses) throw new Error('Not a valid address')

    const stakingContract = this.foxyStakingContracts.find(
      (item) => toLower(item.options.address) === toLower(addresses.staking)
    )
    if (!stakingContract) throw new Error('Not a valid staking contract address')

    const expired = await stakingContract.methods.pauseStaking().call()
    const tvl = await this.tvl({ tokenContractAddress: addresses.foxy })
    const apy = this.apy()
    return transformData({ ...addresses, tvl, apy, expired })
  }

  async getGasPrice() {
    const gasPrice = await this.web3.eth.getGasPrice()
    return bnOrZero(gasPrice)
  }

  async getTxReceipt({ txid }: TxReceipt): Promise<TransactionReceipt> {
    if (!txid) throw new Error('Must pass txid')
    return this.web3.eth.getTransactionReceipt(txid)
  }

  async estimateClaimWithdrawGas(input: ClaimWithdrawal): Promise<BigNumber> {
    const { claimAddress, userAddress, contractAddress } = input
    const addressToClaim = claimAddress ?? userAddress
    this.verifyAddresses([addressToClaim, userAddress, contractAddress])

    const stakingContract = this.foxyStakingContracts.find(
      (item) => toLower(item.options.address) === toLower(contractAddress)
    )
    if (!stakingContract) throw new Error('Not a valid contract address')

    const estimatedGas = await stakingContract.methods.claimWithdraw(addressToClaim).estimateGas({
      from: userAddress
    })
    return bnOrZero(estimatedGas)
  }

  async estimateSendWithdrawalRequestsGas(
    input: TxInputWithoutAmountAndWallet
  ): Promise<BigNumber> {
    const { userAddress, contractAddress } = input
    this.verifyAddresses([userAddress, contractAddress])

    const stakingContract = this.foxyStakingContracts.find(
      (item) => toLower(item.options.address) === toLower(contractAddress)
    )
    if (!stakingContract) throw new Error('Not a valid contract address')

    const estimatedGas = await stakingContract.methods.sendWithdrawalRequests().estimateGas({
      from: userAddress
    })
    return bnOrZero(estimatedGas)
  }

  async estimateAddLiquidityGas(input: EstimateGasTxInput): Promise<BigNumber> {
    const { amountDesired, userAddress, contractAddress } = input
    this.verifyAddresses([userAddress, contractAddress])
    if (!amountDesired.gt(0)) throw new Error('Must send valid amount')

    const liquidityReserveContract = this.liquidityReserveContracts.find(
      (item) => toLower(item.options.address) === toLower(contractAddress)
    )
    if (!liquidityReserveContract) throw new Error('Not a valid contract address')
    const estimatedGas = await liquidityReserveContract.methods
      .addLiquidity(amountDesired.toString())
      .estimateGas({
        from: userAddress
      })
    return bnOrZero(estimatedGas)
  }

  async estimateRemoveLiquidityGas(input: EstimateGasTxInput): Promise<BigNumber> {
    const { amountDesired, userAddress, contractAddress } = input
    this.verifyAddresses([userAddress, contractAddress])
    if (!amountDesired.gt(0)) throw new Error('Must send valid amount')

    const liquidityReserveContract = this.liquidityReserveContracts.find(
      (item) => toLower(item.options.address) === toLower(contractAddress)
    )
    if (!liquidityReserveContract) throw new Error('Not a valid contract address')

    const estimatedGas = await liquidityReserveContract.methods
      .removeLiquidity(amountDesired.toString())
      .estimateGas({
        from: userAddress
      })
    return bnOrZero(estimatedGas)
  }

  async estimateWithdrawGas(input: WithdrawInput): Promise<BigNumber> {
    const { amountDesired, userAddress, contractAddress, type } = input
    this.verifyAddresses([userAddress, contractAddress])

    const stakingContract = this.foxyStakingContracts.find(
      (item) => toLower(item.options.address) === toLower(contractAddress)
    )
    if (!stakingContract) throw new Error('Not a valid contract address')

    const isDelayed = type === WithdrawType.DELAYED && amountDesired
    if (isDelayed && !amountDesired.gt(0)) throw new Error('Must send valid amount')

    const estimatedGas = isDelayed
      ? await stakingContract.methods.unstake(amountDesired.toString(), true).estimateGas({
          from: userAddress
        })
      : await stakingContract.methods.instantUnstake(true).estimateGas({
          from: userAddress
        })
    return bnOrZero(estimatedGas)
  }

  async estimateDepositGas(input: EstimateGasTxInput): Promise<BigNumber> {
    const { amountDesired, userAddress, contractAddress } = input
    this.verifyAddresses([userAddress, contractAddress])
    if (!amountDesired.gt(0)) throw new Error('Must send valid amount')

    const stakingContract = this.foxyStakingContracts.find(
      (item) => toLower(item.options.address) === toLower(contractAddress)
    )
    if (!stakingContract) throw new Error('Not a valid contract address')
    const estimatedGas = await stakingContract.methods
      .stake(amountDesired.toString(), userAddress)
      .estimateGas({
        from: userAddress
      })
    return bnOrZero(estimatedGas)
  }

  async estimateApproveGas(input: EstimateGasApproveInput): Promise<BigNumber> {
    const { userAddress, tokenContractAddress, contractAddress } = input
    this.verifyAddresses([userAddress, contractAddress, tokenContractAddress])

    const depositTokenContract = new this.web3.eth.Contract(erc20Abi, tokenContractAddress)
    const estimatedGas = await depositTokenContract.methods
      .approve(contractAddress, MAX_ALLOWANCE)
      .estimateGas({
        from: userAddress
      })
    return bnOrZero(estimatedGas)
  }

  async approve(input: ApproveInput): Promise<string> {
    const {
      accountNumber = 0,
      dryRun = false,
      tokenContractAddress,
      userAddress,
      wallet,
      contractAddress
    } = input
    this.verifyAddresses([userAddress, contractAddress, tokenContractAddress])
    if (!wallet) throw new Error('Missing inputs')

    let estimatedGasBN: BigNumber
    try {
      estimatedGasBN = await this.estimateApproveGas(input)
    } catch (e) {
      throw new Error(`Estimate Gas Error: ${e}`)
    }
    const depositTokenContract = new this.web3.eth.Contract(erc20Abi, tokenContractAddress)
    const data: string = depositTokenContract.methods
      .approve(contractAddress, MAX_ALLOWANCE)
      .encodeABI({
        from: userAddress
      })

    let nonce: number
    try {
      nonce = await this.web3.eth.getTransactionCount(userAddress)
    } catch (e) {
      throw new Error(`Get nonce Error: ${e}`)
    }
    let gasPrice: string
    try {
      gasPrice = await this.web3.eth.getGasPrice()
    } catch (e) {
      throw new Error(`Get gasPrice Error: ${e}`)
    }
    const bip44Params = this.adapter.buildBIP44Params({ accountNumber })
    const chainId = Number(this.network)
    const estimatedGas = estimatedGasBN.toString()
    const payload = {
      bip44Params,
      chainId,
      data,
      estimatedGas,
      gasPrice,
      nonce: String(nonce),
      to: tokenContractAddress,
      value: '0'
    }
    const txToSign = buildTxToSign(payload)
    if (wallet.supportsOfflineSigning()) {
      const signedTx = await this.adapter.signTransaction({ txToSign, wallet })
      if (dryRun) return signedTx
      return this.broadcastTx(signedTx)
    } else if (wallet.supportsBroadcast() && this.adapter.signAndBroadcastTransaction) {
      if (dryRun) {
        throw new Error(`Cannot perform a dry run with wallet of type ${wallet.getVendor()}`)
      }
      return this.adapter.signAndBroadcastTransaction({ txToSign, wallet })
    } else {
      throw new Error('Invalid HDWallet configuration ')
    }
  }

  async allowance(input: AllowanceInput): Promise<string> {
    const { userAddress, tokenContractAddress, contractAddress } = input
    this.verifyAddresses([userAddress, contractAddress, tokenContractAddress])

    const depositTokenContract: Contract = new this.web3.eth.Contract(
      erc20Abi,
      tokenContractAddress
    )
    return depositTokenContract.methods.allowance(userAddress, contractAddress).call()
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
    this.verifyAddresses([userAddress, contractAddress])
    if (!amountDesired.gt(0)) throw new Error('Must send valid amount')
    if (!wallet) throw new Error('Missing inputs')

    let estimatedGasBN: BigNumber
    try {
      estimatedGasBN = await this.estimateDepositGas(input)
    } catch (e) {
      throw new Error(`Estimate Gas Error: ${e}`)
    }

    const stakingContract = this.foxyStakingContracts.find(
      (item) => toLower(item.options.address) === toLower(contractAddress)
    )

    if (!stakingContract) throw new Error('Not a valid contract address')
    const userChecksum = this.web3.utils.toChecksumAddress(userAddress)

    const data: string = await stakingContract.methods
      .stake(amountDesired.toString(), userAddress)
      .encodeABI({
        value: 0,
        from: userChecksum
      })

    let nonce: number
    try {
      nonce = await this.web3.eth.getTransactionCount(userAddress)
    } catch (e) {
      throw new Error(`Get nonce Error: ${e}`)
    }
    let gasPrice: string
    try {
      gasPrice = await this.web3.eth.getGasPrice()
    } catch (e) {
      throw new Error(`Get gasPrice Error: ${e}`)
    }
    const estimatedGas = estimatedGasBN.toString()
    const bip44Params = this.adapter.buildBIP44Params({ accountNumber })
    const chainId = Number(this.network)
    const payload = {
      bip44Params,
      chainId,
      data,
      estimatedGas,
      gasPrice,
      nonce: String(nonce),
      to: contractAddress,
      value: '0'
    }

    const txToSign = buildTxToSign(payload)
    if (wallet.supportsOfflineSigning()) {
      const signedTx = await this.adapter.signTransaction({ txToSign, wallet })
      if (dryRun) return signedTx
      return this.broadcastTx(signedTx)
    } else if (wallet.supportsBroadcast() && this.adapter.signAndBroadcastTransaction) {
      if (dryRun) {
        throw new Error(`Cannot perform a dry run with wallet of type ${wallet.getVendor()}`)
      }
      return this.adapter.signAndBroadcastTransaction({ txToSign, wallet })
    } else {
      throw new Error('Invalid HDWallet configuration ')
    }
  }

  async withdraw(input: WithdrawInput): Promise<string> {
    const {
      amountDesired,
      accountNumber = 0,
      dryRun = false,
      contractAddress,
      userAddress,
      type,
      wallet
    } = input
    this.verifyAddresses([userAddress, contractAddress])
    if (!wallet) throw new Error('Missing inputs')

    let estimatedGasBN: BigNumber
    try {
      estimatedGasBN = await this.estimateWithdrawGas(input)
    } catch (e) {
      throw new Error(`Estimate Gas Error: ${e}`)
    }

    const stakingContract = this.foxyStakingContracts.find(
      (item) => toLower(item.options.address) === toLower(contractAddress)
    )
    if (!stakingContract) throw new Error('Not a valid contract address')

    const isDelayed = type === WithdrawType.DELAYED && amountDesired
    if (isDelayed && !amountDesired.gt(0)) throw new Error('Must send valid amount')

    const data: string = isDelayed
      ? stakingContract.methods.unstake(amountDesired.toString(), true).encodeABI({
          from: userAddress
        })
      : stakingContract.methods.instantUnstake(true).encodeABI({
          from: userAddress
        })

    let nonce: number
    try {
      nonce = await this.web3.eth.getTransactionCount(userAddress)
    } catch (e) {
      throw new Error(`Get nonce Error: ${e}`)
    }
    let gasPrice: string
    try {
      gasPrice = await this.web3.eth.getGasPrice()
    } catch (e) {
      throw new Error(`Get gasPrice Error: ${e}`)
    }
    const estimatedGas = estimatedGasBN.toString()
    const bip44Params = this.adapter.buildBIP44Params({ accountNumber })
    const chainId = Number(this.network)
    const payload = {
      bip44Params,
      chainId,
      data,
      estimatedGas,
      gasPrice,
      nonce: String(nonce),
      to: contractAddress,
      value: '0'
    }
    const txToSign = buildTxToSign(payload)
    if (wallet.supportsOfflineSigning()) {
      const signedTx = await this.adapter.signTransaction({ txToSign, wallet })
      if (dryRun) return signedTx
      return this.broadcastTx(signedTx)
    } else if (wallet.supportsBroadcast() && this.adapter.signAndBroadcastTransaction) {
      if (dryRun) {
        throw new Error(`Cannot perform a dry run with wallet of type ${wallet.getVendor()}`)
      }
      return this.adapter.signAndBroadcastTransaction({ txToSign, wallet })
    } else {
      throw new Error('Invalid HDWallet configuration ')
    }
  }

  async claimWithdraw(input: ClaimWithdrawal): Promise<string> {
    const {
      accountNumber = 0,
      dryRun = false,
      contractAddress,
      userAddress,
      claimAddress,
      wallet
    } = input
    const addressToClaim = claimAddress ?? userAddress
    this.verifyAddresses([userAddress, contractAddress, addressToClaim])
    if (!wallet) throw new Error('Missing inputs')

    let estimatedGasBN: BigNumber
    try {
      estimatedGasBN = await this.estimateClaimWithdrawGas(input)
    } catch (e) {
      throw new Error(`Estimate Gas Error: ${e}`)
    }

    const stakingContract = this.foxyStakingContracts.find(
      (item) => toLower(item.options.address) === toLower(contractAddress)
    )
    if (!stakingContract) throw new Error('Not a valid contract address')

    // TODO: check if can claimWithdraw and throw an error if can't

    const data: string = stakingContract.methods.claimWithdraw(addressToClaim).encodeABI({
      from: userAddress
    })

    let nonce: number
    try {
      nonce = await this.web3.eth.getTransactionCount(userAddress)
    } catch (e) {
      throw new Error(`Get nonce Error: ${e}`)
    }
    let gasPrice: string
    try {
      gasPrice = await this.web3.eth.getGasPrice()
    } catch (e) {
      throw new Error(`Get gasPrice Error: ${e}`)
    }
    const estimatedGas = estimatedGasBN.toString()
    const bip44Params = this.adapter.buildBIP44Params({ accountNumber })
    const chainId = Number(this.network)
    const payload = {
      bip44Params,
      chainId,
      data,
      estimatedGas,
      gasPrice,
      nonce: String(nonce),
      to: contractAddress,
      value: '0'
    }
    const txToSign = buildTxToSign(payload)
    if (wallet.supportsOfflineSigning()) {
      const signedTx = await this.adapter.signTransaction({ txToSign, wallet })
      if (dryRun) return signedTx
      return this.broadcastTx(signedTx)
    } else if (wallet.supportsBroadcast() && this.adapter.signAndBroadcastTransaction) {
      if (dryRun) {
        throw new Error(`Cannot perform a dry run with wallet of type ${wallet.getVendor()}`)
      }
      return this.adapter.signAndBroadcastTransaction({ txToSign, wallet })
    } else {
      throw new Error('Invalid HDWallet configuration ')
    }
  }

  async sendWithdrawalRequests(input: TxInputWithoutAmount): Promise<string> {
    const { accountNumber = 0, dryRun = false, contractAddress, userAddress, wallet } = input
    this.verifyAddresses([userAddress, contractAddress])
    if (!wallet || !contractAddress) throw new Error('Missing inputs')

    let estimatedGasBN: BigNumber
    try {
      estimatedGasBN = await this.estimateSendWithdrawalRequestsGas(input)
    } catch (e) {
      throw new Error(`Estimate Gas Error: ${e}`)
    }

    const stakingContract = this.foxyStakingContracts.find(
      (item) => toLower(item.options.address) === toLower(contractAddress)
    )
    if (!stakingContract) throw new Error('Not a valid contract address')

    // TODO: check if can sendWithdrawalRequests and throw an error if can't

    const data: string = stakingContract.methods.sendWithdrawalRequests().encodeABI({
      from: userAddress
    })

    let nonce: number
    try {
      nonce = await this.web3.eth.getTransactionCount(userAddress)
    } catch (e) {
      throw new Error(`Get nonce Error: ${e}`)
    }
    let gasPrice: string
    try {
      gasPrice = await this.web3.eth.getGasPrice()
    } catch (e) {
      throw new Error(`Get gasPrice Error: ${e}`)
    }
    const estimatedGas = estimatedGasBN.toString()
    const bip44Params = this.adapter.buildBIP44Params({ accountNumber })
    const chainId = Number(this.network)
    const payload = {
      bip44Params,
      chainId,
      data,
      estimatedGas,
      gasPrice,
      nonce: String(nonce),
      to: contractAddress,
      value: '0'
    }
    const txToSign = buildTxToSign(payload)
    if (wallet.supportsOfflineSigning()) {
      const signedTx = await this.adapter.signTransaction({ txToSign, wallet })
      if (dryRun) return signedTx
      return this.broadcastTx(signedTx)
    } else if (wallet.supportsBroadcast() && this.adapter.signAndBroadcastTransaction) {
      if (dryRun) {
        throw new Error(`Cannot perform a dry run with wallet of type ${wallet.getVendor()}`)
      }
      return this.adapter.signAndBroadcastTransaction({ txToSign, wallet })
    } else {
      throw new Error('Invalid HDWallet configuration ')
    }
  }

  async addLiquidity(input: TxInput): Promise<string> {
    const {
      amountDesired,
      accountNumber = 0,
      dryRun = false,
      contractAddress,
      userAddress,
      wallet
    } = input
    this.verifyAddresses([userAddress, contractAddress])
    if (!amountDesired.gt(0)) throw new Error('Must send valid amount')

    if (!wallet) throw new Error('Missing inputs')

    let estimatedGasBN: BigNumber
    try {
      estimatedGasBN = await this.estimateAddLiquidityGas(input)
    } catch (e) {
      throw new Error(`Estimate Gas Error: ${e}`)
    }

    const liquidityReserveContract = this.liquidityReserveContracts.find(
      (item) => toLower(item.options.address) === toLower(contractAddress)
    )
    if (!liquidityReserveContract) throw new Error('Not a valid contract address')
    const data: string = liquidityReserveContract.methods
      .addLiquidity(amountDesired.toString())
      .encodeABI({
        from: userAddress
      })

    const nonce = await this.web3.eth.getTransactionCount(userAddress)
    const gasPrice = await this.web3.eth.getGasPrice()
    const estimatedGas = estimatedGasBN.toString()
    const bip44Params = this.adapter.buildBIP44Params({ accountNumber })
    const chainId = Number(this.network)
    const payload = {
      bip44Params,
      chainId,
      data,
      estimatedGas,
      gasPrice,
      nonce: String(nonce),
      to: contractAddress,
      value: '0'
    }
    const txToSign = buildTxToSign(payload)
    if (wallet.supportsOfflineSigning()) {
      const signedTx = await this.adapter.signTransaction({ txToSign, wallet })
      if (dryRun) return signedTx
      return this.broadcastTx(signedTx)
    } else if (wallet.supportsBroadcast() && this.adapter.signAndBroadcastTransaction) {
      if (dryRun) {
        throw new Error(`Cannot perform a dry run with wallet of type ${wallet.getVendor()}`)
      }
      return this.adapter.signAndBroadcastTransaction({ txToSign, wallet })
    } else {
      throw new Error('Invalid HDWallet configuration ')
    }
  }

  async removeLiquidity(input: TxInput): Promise<string> {
    const {
      amountDesired,
      accountNumber = 0,
      dryRun = false,
      contractAddress,
      userAddress,
      wallet
    } = input
    this.verifyAddresses([userAddress, contractAddress])
    if (!amountDesired.gt(0)) throw new Error('Must send valid amount')
    if (!wallet) throw new Error('Missing inputs')

    let estimatedGasBN: BigNumber
    try {
      estimatedGasBN = await this.estimateRemoveLiquidityGas(input)
    } catch (e) {
      throw new Error(`Estimate Gas Error: ${e}`)
    }

    const liquidityReserveContract = this.liquidityReserveContracts.find(
      (item) => toLower(item.options.address) === toLower(contractAddress)
    )
    if (!liquidityReserveContract) throw new Error('Not a valid contract address')

    const data: string = liquidityReserveContract.methods
      .removeLiquidity(amountDesired.toString())
      .encodeABI({
        from: userAddress
      })
    const nonce = await this.web3.eth.getTransactionCount(userAddress)
    const gasPrice = await this.web3.eth.getGasPrice()
    const estimatedGas = estimatedGasBN.toString()
    const bip44Params = this.adapter.buildBIP44Params({ accountNumber })
    const chainId = Number(this.network)
    const payload = {
      bip44Params,
      chainId,
      data,
      estimatedGas,
      gasPrice,
      nonce: String(nonce),
      to: contractAddress,
      value: '0'
    }
    const txToSign = buildTxToSign(payload)
    if (wallet.supportsOfflineSigning()) {
      const signedTx = await this.adapter.signTransaction({ txToSign, wallet })
      if (dryRun) return signedTx
      return this.broadcastTx(signedTx)
    } else if (wallet.supportsBroadcast() && this.adapter.signAndBroadcastTransaction) {
      if (dryRun) {
        throw new Error(`Cannot perform a dry run with wallet of type ${wallet.getVendor()}`)
      }
      return this.adapter.signAndBroadcastTransaction({ txToSign, wallet })
    } else {
      throw new Error('Invalid HDWallet configuration ')
    }
  }

  // returns time in seconds until withdraw request is claimable
  // dependent on rebases happening when epoch.expiry block is reached
  async getTimeUntilClaimable(input: TxInputWithoutAmountAndWallet): Promise<string> {
    const { contractAddress, userAddress } = input
    this.verifyAddresses([userAddress, contractAddress])

    const stakingContract = this.foxyStakingContracts.find(
      (item) => toLower(item.options.address) === toLower(contractAddress)
    )
    if (!stakingContract) throw new Error('Not a valid contract address')

    const coolDownInfo = await stakingContract.methods.coolDownInfo(userAddress).call()
    const epoch = await stakingContract.methods.epoch().call()
    const currentBlock = await this.web3.eth.getBlockNumber()
    const epochsLeft = coolDownInfo.expiry - epoch.number - 1 // epochs left after the current one
    const blocksUntilClaimable =
      epoch.endBlock > currentBlock ? epoch.endBlock - currentBlock : 0 + epochsLeft * epoch.length
    const timeUntilClaimable = blocksUntilClaimable * 13 // average block time is 13 seconds

    return timeUntilClaimable.toString()
  }

  async balance(input: BalanceInput): Promise<BigNumber> {
    const { tokenContractAddress, userAddress } = input
    this.verifyAddresses([userAddress, tokenContractAddress])

    const contract = new this.web3.eth.Contract(erc20Abi, tokenContractAddress)
    const balance = await contract.methods.balanceOf(userAddress).call()
    return bnOrZero(balance)
  }

  async instantUnstakeFee(input: InstantUnstakeFeeInput): Promise<BigNumber> {
    const { contractAddress } = input
    this.verifyAddresses([contractAddress])

    const stakingContract = this.foxyStakingContracts.find(
      (item) => toLower(item.options.address) === toLower(contractAddress)
    )
    if (!stakingContract) throw new Error('Not a valid staking contract address')

    const liquidityReserveAddress = await stakingContract.methods.LIQUIDITY_RESERVE().call()
    const liquidityReserveContract = this.liquidityReserveContracts.find(
      (item) => toLower(item.options.address) === toLower(liquidityReserveAddress)
    )
    if (!liquidityReserveContract) throw new Error('Not a valid reserve contract address')
    const feeInBasisPoints = await liquidityReserveContract.methods.fee().call()

    return bnOrZero(feeInBasisPoints / 10000) // convert from basis points to decimal percentage
  }

  async totalSupply({ tokenContractAddress }: TokenAddressInput): Promise<BigNumber> {
    this.verifyAddresses([tokenContractAddress])

    const contract = new this.web3.eth.Contract(erc20Abi, tokenContractAddress)
    const totalSupply = await contract.methods.totalSupply().call()
    return bnOrZero(totalSupply)
  }

  pricePerShare(): BigNumber {
    return bnOrZero(1).times('1e+18')
  }

  // estimated apy
  apy(): string {
    return '.2'
  }

  async tvl(input: TokenAddressInput): Promise<BigNumber> {
    const { tokenContractAddress } = input
    this.verifyAddresses([tokenContractAddress])

    const contract = new this.web3.eth.Contract(foxyAbi, tokenContractAddress)
    const balance = await contract.methods.circulatingSupply().call()
    return bnOrZero(balance)
  }

  async getWithdrawInfo(input: TxInputWithoutAmountAndWallet): Promise<WithdrawInfo> {
    const { contractAddress, userAddress } = input
    this.verifyAddresses([userAddress, contractAddress])

    const stakingContract = this.foxyStakingContracts.find(
      (item) => toLower(item.options.address) === toLower(contractAddress)
    )
    if (!stakingContract) throw new Error('Not a valid contract address')

    const coolDownInfo = await stakingContract.methods.coolDownInfo(userAddress).call()
    return coolDownInfo
  }
}
