// import { ChainAdapterManager } from '@shapeshiftoss/chain-adapters'
// import { NativeAdapterArgs, NativeHDWallet } from '@shapeshiftoss/hdwallet-native'
// import { ChainTypes } from '@shapeshiftoss/types'
import { bnOrZero } from './utils'
import dotenv from 'dotenv'

import { YearnInvestor } from './YearnInvestor'

dotenv.config()

// const { DEVICE_ID = 'device123', MNEMONIC } = process.env

// const getWallet = async (): Promise<NativeHDWallet> => {
//   if (!MNEMONIC) {
//     throw new Error('Cannot init native wallet without mnemonic')
//   }
//   const nativeAdapterArgs: NativeAdapterArgs = {
//     mnemonic: MNEMONIC,
//     deviceId: DEVICE_ID
//   }
//   const wallet = new NativeHDWallet(nativeAdapterArgs)
//   await wallet.initialize()

//   return wallet
// }

const main = async (): Promise<void> => {
  // const adapterManager = new ChainAdapterManager(unchainedUrls)
  // const wallet = await getWallet()

  const yearnInvestor = new YearnInvestor({
    providerUrl: 'https://daemon.ethereum.shapeshift.com', // 'https://api.ethereum.shapeshift.com',
    dryRun: true
  })

  const address = '0x358dae76Bb42Be167dD5A64f95E0d537b024834e'
  const usdcCaip19 = 'eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'.toLowerCase()

  const opportunities = await yearnInvestor.findByUnderlyingAssetId(usdcCaip19)
  // const opportunities = await yearnInvestor.findAll()
  const opportunity = opportunities[1]
  console.log({ opportunity })

  const approvalResponse = await opportunity.prepareApprove(address)
  const withdrawResponse = await opportunity.prepareDeposit({ address, amount: bnOrZero(1000) })
  const depositResponse = await opportunity.prepareWithdrawal({ address, amount: bnOrZero(1000) })
  console.log({ approvalResponse, depositResponse, withdrawResponse })

  // for (let o of opportunities) {
  //   try {
  //   console.log('opportunity', o)
  //   const result = await o?.allowance(address)
  //   console.log('result', result)
  //   } catch (e) {
  //     console.log(e)
  //   }
  // }
}

main().then(() => console.info('Exit')).catch((e) => { console.error(e), process.exit(1) })
