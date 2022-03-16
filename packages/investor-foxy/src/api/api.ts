import { JsonRpcProvider } from '@ethersproject/providers'
import { ChainReference } from '@shapeshiftoss/caip/dist/caip2/caip2'
import { ChainAdapter } from '@shapeshiftoss/chain-adapters'
import { ChainTypes } from '@shapeshiftoss/types'
import { BigNumber } from 'bignumber.js'
import { toLower } from 'lodash'
import Web3 from 'web3'
import { HttpProvider, TransactionReceipt } from 'web3-core/types'
import { Contract } from 'web3-eth-contract'

import { DefiType, erc20Abi, foxyStakingAbi, foxyAddresses, MAX_ALLOWANCE } from '../constants'
import { foxyAbi } from '../constants/foxy-abi'
import { liquidityReserveAbi } from '../constants/liquidity-reserve-abi'
import { bnOrZero, buildTxToSign } from '../utils'
import {
  Allowanceinput,
  ApproveInput,
  BalanceInput,
  EstimateGasApproveInput,
  EstimateGasTxInput,
  TVLInput,
  TxInput
} from './foxy-types'

export type ConstructorArgs = {
  adapter: ChainAdapter<ChainTypes.Ethereum>
  providerUrl: string
  network?:
    | ChainReference.EthereumMainnet
    | ChainReference.EthereumRinkeby
    | ChainReference.EthereumRopsten
}

type FoxyOpportunityInputData = {
  tvl?: BigNumber
  apy?: string
  expired?: boolean
  staking: string
  foxy: string
  fox: string
  liquidityReserve: string
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
  public adapter: ChainAdapter<ChainTypes.Ethereum>
  public provider: HttpProvider
  public jsonRpcProvider: JsonRpcProvider
  public web3: Web3
  private foxyStakingContracts: Contract[]
  private liquidityReserveContracts: Contract[]

  constructor({ adapter, providerUrl }: ConstructorArgs) {
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
  }

  async getFoxyOpportunities() {
    const opportunities = await Promise.all(
      foxyAddresses.map(async (addresses) => {
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
  }

  async getFoxyOpportunityByStakingAddress(stakingAddress: string) {
    const addresses = foxyAddresses.find(async (item) => {
      return item.staking === stakingAddress
    })

    if (!addresses) throw new Error('Not a valid staking contract address')

    const stakingContract = this.foxyStakingContracts.find(
      (item) => toLower(item.options.address) === toLower(addresses.staking)
    )
    const expired = await stakingContract?.methods.pauseStaking().call()
    const tvl = await this.tvl({ tokenContractAddress: addresses.foxy })
    const apy = this.apy()
    return transformData({ ...addresses, tvl, apy, expired })
  }

  private async broadcastTx(signedTx: string) {
    return this.adapter.broadcastTransaction(signedTx)
    // TODO: add if statement for local/cli testing
    // const sendSignedTx = await this.web3.eth.sendSignedTransaction(signedTx)
    // return sendSignedTx?.blockHash
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

  async estimateClaimWithdrawGas(
    input: Pick<EstimateGasTxInput, Exclude<keyof EstimateGasTxInput, 'amountDesired'>> & {
      claimAddress?: string
    }
  ): Promise<BigNumber> {
    const { claimAddress, userAddress, contractAddress } = input
    const stakingContract = this.foxyStakingContracts.find(
      (item) => toLower(item.options.address) === toLower(contractAddress)
    )
    if (!stakingContract) throw new Error('Not a valid contract address')

    const estimatedGas = await stakingContract.methods
      .claimWithdraw(claimAddress ?? userAddress)
      .estimateGas({
        from: userAddress
      })
    return bnOrZero(estimatedGas)
  }

  async estimateAddLiquidityGas(input: EstimateGasTxInput): Promise<BigNumber> {
    const { amountDesired, userAddress, contractAddress } = input
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

  async estimateWithdrawGas(input: EstimateGasTxInput): Promise<BigNumber> {
    const { amountDesired, userAddress, contractAddress } = input
    const stakingContract = this.foxyStakingContracts.find(
      (item) => toLower(item.options.address) === toLower(contractAddress)
    )
    if (!stakingContract) throw new Error('Not a valid contract address')

    const estimatedGas = await stakingContract.methods
      .unstake(amountDesired.toString(), true)
      .estimateGas({
        from: userAddress
      })
    return bnOrZero(estimatedGas)
  }

  async estimateInstantWithdrawGas(
    input: Pick<EstimateGasTxInput, Exclude<keyof EstimateGasTxInput, 'amountDesired'>>
  ): Promise<BigNumber> {
    const { userAddress, contractAddress } = input
    const stakingContract = this.foxyStakingContracts.find(
      (item) => toLower(item.options.address) === toLower(contractAddress)
    )
    if (!stakingContract) throw new Error('Not a valid contract address')
    const estimatedGas = await stakingContract.methods.instantUnstake(true).estimateGas({
      from: userAddress
    })
    return bnOrZero(estimatedGas)
  }

  async estimateDepositGas(input: EstimateGasTxInput): Promise<BigNumber> {
    const { amountDesired, userAddress, contractAddress, tokenContractAddress } = input
    const stakingContract = this.foxyStakingContracts.find(
      (item) => toLower(item.options.address) === toLower(contractAddress)
    )
    if (!stakingContract) throw new Error('Not a valid contract address')
    if (!tokenContractAddress) throw new Error('Not a valid contract address')
    const estimatedGas = await stakingContract.methods
      .stake(amountDesired.toString(), userAddress)
      .estimateGas({
        from: userAddress
      })
    return bnOrZero(estimatedGas)
  }

  async estimateApproveGas(input: EstimateGasApproveInput): Promise<BigNumber> {
    const { userAddress, tokenContractAddress, contractAddress } = input
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
    if (!wallet) throw new Error('Missing inputs')
    const estimatedGas: BigNumber = await this.estimateApproveGas(input)
    const depositTokenContract = new this.web3.eth.Contract(erc20Abi, tokenContractAddress)
    const data: string = depositTokenContract.methods
      .approve(contractAddress, MAX_ALLOWANCE)
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

  async allowance(input: Allowanceinput): Promise<string> {
    const { userAddress, tokenContractAddress, contractAddress } = input
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
    if (!wallet || !contractAddress) throw new Error('Missing inputs')
    const estimatedGas: BigNumber = await this.estimateDepositGas(input)
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
    const nonce = await this.web3.eth.getTransactionCount(userAddress)
    const gasPrice = await this.web3.eth.getGasPrice()

    const txToSign = buildTxToSign({
      bip44Params: this.adapter.buildBIP44Params({ accountNumber }),
      chainId: 1,
      data,
      estimatedGas: estimatedGas.toString(),
      gasPrice,
      nonce: String(nonce),
      to: contractAddress,
      value: '0'
    })
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
    const stakingContract = this.foxyStakingContracts.find(
      (item) => toLower(item.options.address) === toLower(contractAddress)
    )
    if (!stakingContract) throw new Error('Not a valid contract address')

    const data: string = stakingContract.methods.unstake(amountDesired.toString(), true).encodeABI({
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
      to: contractAddress,
      value: '0'
    })
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

  async instantWithdraw(
    input: Pick<TxInput, Exclude<keyof TxInput, 'amountDesired'>>
  ): Promise<string> {
    const { accountNumber = 0, dryRun = false, contractAddress, userAddress, wallet } = input
    if (!wallet || !contractAddress) throw new Error('Missing inputs')
    const estimatedGas: BigNumber = await this.estimateInstantWithdrawGas(input)
    const stakingContract = this.foxyStakingContracts.find(
      (item) => toLower(item.options.address) === toLower(contractAddress)
    )
    if (!stakingContract) throw new Error('Not a valid contract address')

    const data: string = stakingContract.methods.instantUnstake(true).encodeABI({
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
      to: contractAddress,
      value: '0'
    })
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

  async claimWithdraw(
    input: Pick<TxInput, Exclude<keyof TxInput, 'amountDesired'>> & { claimAddress?: string }
  ): Promise<string> {
    const {
      accountNumber = 0,
      dryRun = false,
      contractAddress,
      userAddress,
      claimAddress,
      wallet
    } = input
    if (!wallet || !contractAddress) throw new Error('Missing inputs')
    const estimatedGas: BigNumber = await this.estimateClaimWithdrawGas(input)
    const stakingContract = this.foxyStakingContracts.find(
      (item) => toLower(item.options.address) === toLower(contractAddress)
    )
    if (!stakingContract) throw new Error('Not a valid contract address')

    const data: string = stakingContract.methods
      .claimWithdraw(claimAddress ?? userAddress)
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
      to: contractAddress,
      value: '0'
    })
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

  async sendWithdrawalRequests(
    input: Pick<TxInput, Exclude<keyof TxInput, 'amountDesired'>>
  ): Promise<string> {
    const { accountNumber = 0, dryRun = false, contractAddress, userAddress, wallet } = input
    if (!wallet || !contractAddress) throw new Error('Missing inputs')
    const estimatedGas: BigNumber = await this.estimateClaimWithdrawGas(input)
    const stakingContract = this.foxyStakingContracts.find(
      (item) => toLower(item.options.address) === toLower(contractAddress)
    )
    if (!stakingContract) throw new Error('Not a valid contract address')

    const data: string = stakingContract.methods.claimWithdraw(userAddress).encodeABI({
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
      to: contractAddress,
      value: '0'
    })
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
    if (!wallet || !contractAddress) throw new Error('Missing inputs')
    const estimatedGas: BigNumber = await this.estimateAddLiquidityGas(input)
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
    const txToSign = buildTxToSign({
      bip44Params: this.adapter.buildBIP44Params({ accountNumber }),
      chainId: 1,
      data,
      estimatedGas: estimatedGas.toString(),
      gasPrice,
      nonce: String(nonce),
      to: contractAddress,
      value: '0'
    })
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
    if (!wallet || !contractAddress) throw new Error('Missing inputs')
    const estimatedGas: BigNumber = await this.estimateRemoveLiquidityGas(input)
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
    const txToSign = buildTxToSign({
      bip44Params: this.adapter.buildBIP44Params({ accountNumber }),
      chainId: 1,
      data,
      estimatedGas: estimatedGas.toString(),
      gasPrice,
      nonce: String(nonce),
      to: contractAddress,
      value: '0'
    })
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

  async getTimeUntilClaim(
    input: Pick<TxInput, Exclude<keyof TxInput, 'amountDesired'>>
  ): Promise<string> {
    const { contractAddress, userAddress } = input
    const stakingContract = this.foxyStakingContracts.find(
      (item) => toLower(item.options.address) === toLower(contractAddress)
    )
    if (!stakingContract) throw new Error('Not a valid contract address')

    // const coolDown = await stakingContract.methods.coolDownInfo(userAddress).call()
    // const epoch = await stakingContract.methods.epoch().call()
    // console.info('coolDown', coolDown)
    // console.log('epoch', epoch)

    // TODO: calculate time left from expiry
    return '10000000'
  }

  async balance(input: BalanceInput): Promise<BigNumber> {
    const { tokenContractAddress, userAddress } = input
    const contract = new this.web3.eth.Contract(erc20Abi, tokenContractAddress)
    const balance = await contract.methods.balanceOf(userAddress).call()
    return bnOrZero(balance)
  }

  async totalSupply({
    tokenContractAddress
  }: {
    tokenContractAddress: string
  }): Promise<BigNumber> {
    const contract = new this.web3.eth.Contract(erc20Abi, tokenContractAddress)
    const totalSupply = await contract.methods.totalSupply().call()
    return bnOrZero(totalSupply)
  }

  pricePerShare(): BigNumber {
    return bnOrZero(1)
  }

  // estimated apy
  apy(): string {
    return '.2'
  }

  async tvl(input: TVLInput): Promise<BigNumber> {
    const { tokenContractAddress } = input
    const contract = new this.web3.eth.Contract(foxyAbi, tokenContractAddress)
    const balance = await contract.methods.circulatingSupply().call()
    return bnOrZero(balance)
  }
}

// functions for claiming TOKE

// /**
//       @notice claim TOKE from Tokemak
//       @param _amount uint
//       @param _v uint
//       @param _r bytes
//       @param _s bytes
//    */
//       function claimFromTokemak(
//         uint256 _amount,
//         uint8 _v,
//         bytes32 _r,
//         bytes32 _s
//     ) external {
//         // cannot claim 0
//         require(_amount > 0, "Must enter valid amount");

//         ITokeReward tokeRewardContract = ITokeReward(TOKE_REWARD);
//         ITokeRewardHash iTokeRewardHash = ITokeRewardHash(TOKE_REWARD_HASH);

//         uint256 latestCycleIndex = iTokeRewardHash.latestCycleIndex();
//         Recipient memory recipient = Recipient({
//             chainId: 1,
//             cycle: latestCycleIndex,
//             wallet: address(this),
//             amount: _amount
//         });
//         tokeRewardContract.claim(recipient, _v, _r, _s);
//     }

//     /**
//         @notice get claimable amount of TOKE from Tokemak
//         @param _amount uint
//         @return uint
//      */
//     function getClaimableAmountTokemak(uint256 _amount)
//         external
//         view
//         returns (uint256)
//     {
//         ITokeReward tokeRewardContract = ITokeReward(tokeReward);
//         ITokeRewardHash iTokeRewardHash = ITokeRewardHash(tokeRewardHash);

//         uint256 latestCycleIndex = iTokeRewardHash.latestCycleIndex();

//         Recipient memory recipient = Recipient({
//             chainId: 1,
//             cycle: latestCycleIndex,
//             wallet: address(this),
//             amount: _amount
//         });
//         uint256 claimableAmount = tokeRewardContract.getClaimableAmount(
//             recipient
//         );

//         return claimableAmount;
//     }

//     struct CycleHash {
//         string latestClaimable;
//         string cycle;
//     }

//     /**
//         @notice get latest ipfs info from Tokemak
//      */
//     function getTokemakIpfsInfo() external view returns (CycleHash memory) {
//         ITokeRewardHash iTokeRewardHash = ITokeRewardHash(tokeRewardHash);
//         uint256 latestCycleIndex = iTokeRewardHash.latestCycleIndex();
//         (string memory latestClaimable, string memory cycle) = iTokeRewardHash
//             .cycleHashes(latestCycleIndex);

//         CycleHash memory info = CycleHash({
//             latestClaimable: latestClaimable,
//             cycle: cycle
//         });

//         return info;
//     }
