import { ChainAdapterManager } from '@shapeshiftoss/chain-adapters'
import { NativeAdapterArgs, NativeHDWallet } from '@shapeshiftoss/hdwallet-native'
import { ChainTypes } from '@shapeshiftoss/types'
import BigNumber from 'bignumber.js'
import dotenv from 'dotenv'
import readline from 'readline-sync'

import { FoxyApi } from './api'
import { foxyAddresses } from './constants'

dotenv.config()

const { DEVICE_ID = 'device123', MNEMONIC } = process.env

const getWallet = async (): Promise<NativeHDWallet> => {
  if (!MNEMONIC) {
    throw new Error('Cannot init native wallet without mnemonic')
  }
  const nativeAdapterArgs: NativeAdapterArgs = {
    mnemonic: MNEMONIC,
    deviceId: DEVICE_ID
  }
  const wallet = new NativeHDWallet(nativeAdapterArgs)
  await wallet.initialize()

  return wallet
}

const main = async (): Promise<void> => {
  const XHR = require('xhr2-cookies').XMLHttpRequest
  // gives better message for Invalid JSON RPC "" Error
  XHR.prototype._onHttpRequestError = function (request: any, error: any) {
    if (this._request !== request) {
      return
    }
    console.log(error, 'request')
    this._setError()
    request.abort()
    this._setReadyState(XHR.DONE)
    this._dispatchProgress('error')
    this._dispatchProgress('loadend')
  }

  const unchainedUrls = {
    [ChainTypes.Ethereum]: {
      httpUrl: 'http://api.ethereum.shapeshift.com',
      wsUrl: 'ws://api.ethereum.shapeshift.com'
    }
  }
  const adapterManager = new ChainAdapterManager(unchainedUrls)
  const wallet = await getWallet()

  // using 0 value array since only one contract subset exists
  const foxyContractAddress = foxyAddresses[0].foxy
  const foxContractAddress = foxyAddresses[0].fox
  const foxyStakingContractAddress = foxyAddresses[0].staking
  const liquidityReserveContractAddress = foxyAddresses[0].liquidityReserve

  const api = new FoxyApi({
    adapter: adapterManager.byChain(ChainTypes.Ethereum), // adapter is an ETH @shapeshiftoss/chain-adapters
    providerUrl: 'http://127.0.0.1:8545'
  })
  const hey = await api.getFoxyOpportunityByStakingAddress(
    '0x88167bEb4869910e90a8a845886EB98bc12d58e5'
  )
  console.log('hey', hey)
  const userAddress = await adapterManager.byChain(ChainTypes.Ethereum).getAddress({ wallet })
  console.info('current user address ', userAddress)

  const circulatingSupply = async () => {
    try {
      const supply = await api.tvl({ tokenContractAddress: foxyContractAddress })
      console.info('circulatingSupply', supply.toString())
    } catch (e) {
      console.error('Circulating Supply Error:', e)
    }
  }

  const totalSupply = async () => {
    try {
      const supply = await api.totalSupply({ tokenContractAddress: foxyContractAddress })
      console.info('totalSupply', supply.toString())
    } catch (e) {
      console.error('Total Supply Error:', e)
    }
  }

  const stakingTokenBalance = async () => {
    try {
      const balance = await api.balance({
        tokenContractAddress: foxContractAddress,
        userAddress
      })
      console.info('Staking Balance', balance.toString())
    } catch (e) {
      console.error('Staking Balance Error:', e)
    }
  }

  const rewardTokenBalance = async () => {
    try {
      const balance = await api.balance({
        tokenContractAddress: foxyContractAddress,
        userAddress
      })
      console.info('Reward Balance', balance.toString())
    } catch (e) {
      console.error('Reward Balance Error:', e)
    }
  }

  const approve = async (tokenContractAddress: string, contractAddress: string) => {
    try {
      const response = await api.approve({
        tokenContractAddress,
        contractAddress,
        userAddress,
        wallet
      })
      console.info('approve', response)
    } catch (e) {
      console.error('Approve Error:', e)
    }
  }

  const stake = async (amount: string) => {
    try {
      console.info('staking...')
      const response = await api.deposit({
        contractAddress: foxyStakingContractAddress,
        tokenContractAddress: foxContractAddress,
        amountDesired: new BigNumber(amount),
        userAddress,
        wallet
      })
      console.info('stake', response)
    } catch (e) {
      console.error('Stake Error:', e)
    }
  }

  const unstake = async (amount: string) => {
    try {
      console.info('unstaking...')
      const response = await api.withdraw({
        contractAddress: foxyStakingContractAddress,
        tokenContractAddress: foxContractAddress,
        amountDesired: new BigNumber(amount),
        userAddress,
        wallet
      })
      console.info('unstake', response)
    } catch (e) {
      console.error('Unstake Error:', e)
    }
  }

  const instantUnstake = async () => {
    try {
      console.info('instantUnstaking...')
      const response = await api.instantWithdraw({
        contractAddress: foxyStakingContractAddress,
        tokenContractAddress: foxContractAddress,
        userAddress,
        wallet
      })
      console.info('instantUnstake', response)
    } catch (e) {
      console.error('InstantUnstake Error:', e)
    }
  }

  const claimWithdraw = async (claimAddress: string) => {
    try {
      console.info('claiming withdraw...')
      const response = await api.claimWithdraw({
        contractAddress: foxyStakingContractAddress,
        tokenContractAddress: foxContractAddress,
        claimAddress,
        userAddress,
        wallet
      })
      console.info('claimWithdraw', response)
    } catch (e) {
      console.error('ClaimWithdraw Error:', e)
    }
  }

  const addLiquidity = async (amount: string) => {
    try {
      console.info('adding liquidity...')
      const response = await api.addLiquidity({
        contractAddress: liquidityReserveContractAddress,
        userAddress,
        amountDesired: new BigNumber(amount),
        wallet
      })
      console.info('addLiquidity', response)
    } catch (e) {
      console.error('addLiquidity Error:', e)
    }
  }

  const removeLiquidity = async (amount: string) => {
    try {
      console.info('removing liquidity...')
      const response = await api.removeLiquidity({
        contractAddress: liquidityReserveContractAddress,
        userAddress,
        amountDesired: new BigNumber(amount),
        wallet
      })
      console.info('removeLiquidity', response)
    } catch (e) {
      console.error('removeLiquidity Error:', e)
    }
  }

  const coolDownInfo = async () => {
    try {
      console.info('getting coolDownInfo...')
      const response = await api.coolDownInfo({
        contractAddress: foxyStakingContractAddress,
        userAddress,
        wallet
      })
      console.info('coolDownInfo', response)
    } catch (e) {
      console.error('ClaimWithdraw Error:', e)
    }
  }

  const options = [
    'Approve StakingContract',
    'Approve LiquidityReserve',
    'Stake',
    'Unstake',
    'Instant Unstake',
    'Claim Withdraw',
    'Reward Token Balance',
    'Staking Token Balance',
    'Total Supply',
    'Circulating Supply (TVL)',
    'Cool Down Info',
    'Add Liquidity',
    'Remove Liquidity'
  ]
  const contracts = ['Staking Token', 'Reward Token']
  const addresses = ['User Address', 'Liquidity Reserve Address']

  let index = readline.keyInSelect(options, 'Select an action.\n')

  while (index !== -1) {
    let amount = '0'
    let tokenContract
    let claimAddress
    switch (index) {
      case 0:
        tokenContract = readline.keyInSelect(contracts, 'Which contract do you want to approve.\n')
        switch (tokenContract) {
          case 0:
            await approve(foxContractAddress, foxyStakingContractAddress)
            break
          case 1:
            await approve(foxyContractAddress, foxyStakingContractAddress)
            break
          default:
            break
        }
        break
      case 1:
        tokenContract = readline.keyInSelect(contracts, 'Which contract do you want to approve.\n')
        switch (tokenContract) {
          case 0:
            await approve(foxContractAddress, liquidityReserveContractAddress)
            break
          case 1:
            await approve(foxyContractAddress, liquidityReserveContractAddress)
            break
          default:
            break
        }
        break
      case 2:
        amount = readline.question('How much do you want to stake?\n')
        await stake(amount)
        break
      case 3:
        amount = readline.question('How much do you want to unstake?\n')
        await unstake(amount)
        break
      case 4:
        await instantUnstake()
        break
      case 5:
        claimAddress = readline.keyInSelect(addresses, 'Which address do you want to claim.\n')
        switch (claimAddress) {
          case 0:
            await claimWithdraw(userAddress)
            break
          case 1:
            await claimWithdraw(liquidityReserveContractAddress)
            break
          default:
            break
        }
        break
      case 6:
        await rewardTokenBalance()
        break
      case 7:
        await stakingTokenBalance()
        break
      case 8:
        await totalSupply()
        break
      case 9:
        await circulatingSupply()
        break
      case 10:
        await coolDownInfo()
        break
      case 11:
        amount = readline.question('How much liqidity do you want to add?\n')
        await addLiquidity(amount)
        break
      case 12:
        amount = readline.question('How much liquidity do you want to remove?\n')
        await removeLiquidity(amount)
        break
    }
    index = readline.keyInSelect(options, 'Select an action.\n')
  }
}

main().then(() => console.info('Exit'))
