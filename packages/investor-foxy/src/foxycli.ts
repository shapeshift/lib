import { ChainAdapterManager } from '@shapeshiftoss/chain-adapters'
import { ChainTypes } from '@shapeshiftoss/types'
import BigNumber from 'bignumber.js'
import dotenv from 'dotenv'
import readline from 'readline-sync'
import Web3 from 'web3'
import { FoxyApi } from './api'
import { erc20Abi, foxyContractAddress } from './constants'
import { NativeAdapterArgs, NativeHDWallet } from '@shapeshiftoss/hdwallet-native'

dotenv.config()

const {
  UNCHAINED_HTTP_API = 'http://localhost:31300',
  UNCHAINED_WS_API = 'wss://localhost:31300',
  ETH_NODE_URL = 'http://localhost:3000',
  DEVICE_ID = 'device123',
  MNEMONIC = 'salon adapt foil saddle orient make page zero cheese marble test catalog'
} = process.env

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
  const [, , ...args] = process.argv

  const unchainedUrls = {
    [ChainTypes.Ethereum]: {
      httpUrl: 'https://api.ethereum.shapeshift.com',
      wsUrl: 'wss://api.ethereum.shapeshift.com'
    }
  }
  const adapterManager = new ChainAdapterManager(unchainedUrls)
  const web3Provider = new Web3.providers.HttpProvider('http://127.0.0.1:8545')
  const web3 = new Web3(web3Provider)
  const wallet = await getWallet()

  const api = new FoxyApi({
    adapter: adapterManager.byChain(ChainTypes.Ethereum), // adapter is an ETH @shapeshiftoss/chain-adapters
    providerUrl: 'http://127.0.0.1:8545'
  })

  const foxyContract = new web3.eth.Contract(erc20Abi, foxyContractAddress)
  const userAddress = await adapterManager.byChain(ChainTypes.Ethereum).getAddress({ wallet })
  console.log('talking from ', userAddress)

  //   const totalSupply = await api.totalSupply({ contractAddress: foxyContractAddress })
  //   console.log('total', totalSupply)

  //   const balance = await api.balance({
  //     contractAddress: foxyContractAddress,
  //     userAddress
  //   })
  //   console.log('balance', balance)

  try {
    const approve = await api.approve({
      tokenContractAddress: foxyContractAddress,
      userAddress,
      wallet
    })
    console.log('approve', approve)

  } catch (e) {
    console.log('e', e)
  }

  //   const answer = readline.question(
  //     `Swap ${sellAmount} ${sellAsset.symbol} for ${buyAmount} ${
  //       buyAsset.symbol
  //     } on ${swapper.getType()}? (y/n): `
  //   )
  //   if (answer === 'y') {
  //     const txid = await swapper.executeQuote({ quote, wallet })
  //     console.info('broadcast tx with id: ', txid)
  //   }
}

main().then(() => console.info('Done'))
