/* eslint-disable @typescript-eslint/no-unused-vars */
import { NativeAdapterArgs, NativeHDWallet } from '@shapeshiftoss/hdwallet-native'
import { BIP44Params } from '@shapeshiftoss/types'
import * as unchained from '@shapeshiftoss/unchained-client'
import dotenv from 'dotenv'

import { cosmossdk } from './'
import { ChainAdapter as BitcoinChainAdapter } from './bitcoin/BitcoinChainAdapter'
import { ChainAdapter as CosmosChainAdapter } from './cosmossdk/cosmos'
import { ChainAdapter as OsmosisChainAdapter } from './cosmossdk/osmosis'
import { ChainAdapter as EthereumChainAdapter } from './ethereum/EthereumChainAdapter'

dotenv.config()

const getWallet = async (): Promise<NativeHDWallet> => {
  const nativeAdapterArgs: NativeAdapterArgs = {
    mnemonic: process.env.CLI_MNEMONIC,
    deviceId: 'test'
  }
  const wallet = new NativeHDWallet(nativeAdapterArgs)
  await wallet.initialize()

  return wallet
}

const main = async () => {
  try {
    const btcChainAdapter = new BitcoinChainAdapter({
      providers: {
        ws: new unchained.ws.Client<unchained.Tx>('wss://dev-api.bitcoin.shapeshift.com'),
        http: new unchained.bitcoin.V1Api(
          new unchained.ethereum.Configuration({
            basePath: 'https://dev-api.ethereum.shapeshift.com'
          })
        )
      },
      coinName: 'Bitcoin'
    })

    const ethChainAdapter = new EthereumChainAdapter({
      providers: {
        ws: new unchained.ws.Client<unchained.ethereum.ParsedTx>(
          'wss://dev-api.ethereum.shapeshift.com'
        ),
        http: new unchained.ethereum.V1Api(
          new unchained.ethereum.Configuration({
            basePath: 'https://dev-api.ethereum.shapeshift.com'
          })
        )
      }
    })

    const cosmosChainAdapter = new CosmosChainAdapter({
      providers: {
        ws: new unchained.ws.Client<unchained.cosmos.Tx>('wss://dev-api.cosmos.shapeshift.com'),
        http: new unchained.cosmos.V1Api(
          new unchained.cosmos.Configuration({
            basePath: 'https://dev-api.cosmos.shapeshift.com'
          })
        )
      },
      coinName: 'Cosmos'
    })

    const osmosisChainAdapter = new OsmosisChainAdapter({
      providers: {
        ws: new unchained.ws.Client<unchained.osmosis.Tx>('wss://dev-api.ethereum.shapeshift.com'),
        http: new unchained.osmosis.V1Api(
          new unchained.osmosis.Configuration({
            basePath: 'https://dev-api.cosmos.shapeshift.com'
          })
        )
      },
      coinName: 'Osmosis'
    })

    const adapters = {
      btc: btcChainAdapter,
      eth: ethChainAdapter,
      cosmos: cosmosChainAdapter,
      osmo: osmosisChainAdapter
    } as const

    const wallet = await getWallet()
    await wallet.wipe()
    await wallet.loadDevice({
      mnemonic: process.env.CLI_MNEMONIC as string,
      label: 'test',
      skipChecksum: true
    })

    // /** BITCOIN CLI */
    // const btcBip44Params: BIP44Params = {
    //   purpose: 84,
    //   coinType: 0,
    //   accountNumber: 0,
    //   isChange: false,
    //   index: 10
    // }

    // const btcAddress = await btcChainAdapter.getAddress({
    //   wallet,
    //   bip44Params: btcBip44Params,
    //   accountType: UtxoAccountType.SegwitNative
    // })
    // console.log('btcAddress:', btcAddress)

    // const btcAccount = await btcChainAdapter.getAccount(btcAddress)
    // console.log('btcAccount:', btcAccount)

    if (broadcast) {
      const txid = await chainAdapter.broadcastTransaction(signedTx)
      console.log('bitcoin: txid: ', txid)
    }
  } catch (err) {
    console.log('bitcoin: tx error:', err.message)
  }
}

// @ts-ignore:nextLine
const testEthereum = async (
  chainAdapterManager: ChainAdapterManager,
  wallet: NativeHDWallet,
  broadcast = false
) => {
  const chainAdapter = chainAdapterManager.byChain(ChainTypes.Ethereum)
  const bip44Params: BIP44Params = { purpose: 44, coinType: 60, accountNumber: 0 }

  const address = await chainAdapter.getAddress({ wallet, bip44Params })
  console.log('ethereum: address:', address)

    // /** ETHEREUM CLI */
    // const ethBip44Params: BIP44Params = { purpose: 44, coinType: 60, accountNumber: 0 }

  const txHistory = await chainAdapter.getTxHistory({ pubkey: address })
  console.log('ethereum: txHistory:', txHistory)

  await chainAdapter.subscribeTxs(
    { wallet, bip44Params },
    (msg) => console.log('ethereum: tx:', msg),
    (err) => console.log(err)
  )

  try {
    const feeData = await chainAdapter.getFeeData({
      to: '0x642F4Bda144C63f6DC47EE0fDfbac0a193e2eDb7',
      value: '123',
      chainSpecific: {
        from: '0x0000000000000000000000000000000000000000',
        contractData: '0x'
      }
    })
    console.log('ethereum: feeData', feeData)
  } catch (err) {
    console.log('ethereum: feeData error:', err.message)
  }

  // send eth example
  try {
    const unsignedTx = await chainAdapter.buildSendTransaction({
      to: `0x47CB53752e5dc0A972440dA127DCA9FBA6C2Ab6F`,
      value: '1',
      wallet,
      bip44Params,
      chainSpecific: { gasPrice: '0', gasLimit: '0' }
    })

    //const unsignedTx = await chainAdapter.buildSendTransaction({
    //  to: `0x47CB53752e5dc0A972440dA127DCA9FBA6C2Ab6F`,
    //  value: '1',
    //  wallet,
    //  bip44Params,
    //  chainSpecific: {
    //    gasPrice: '0',
    //    gasLimit: '0',
    //    erc20ContractAddress: '0xc770eefad204b5180df6a14ee197d99d808ee52d' // FOX
    //  }
    //})

    //   //const erc20TxID = await ethChainAdapter.broadcastTransaction(erc20SignedTx)
    //   //console.log('erc20TxID:', erc20TxID)
    // } catch (err) {
    //   console.log('erc20Tx error:', err.message)
    // }

    /** COSMOS CLI */
    const cosmosBip44Params: BIP44Params = { purpose: 44, coinType: 118, accountNumber: 0 }

    const cosmosAddress = await adapters.cosmos.getAddress({
      wallet,
      txToSign: unsignedTx.txToSign
    })
    console.log('ethereum: signedTx:', signedTx)

    if (broadcast) {
      const txid = await chainAdapter.broadcastTransaction(signedTx)
      console.log('ethereum: txid:', txid)
    }
  } catch (err) {
    console.log('ethereum: tx error:', err.message)
  }
}

    const cosmosAccount = await adapters.cosmos.getAccount(cosmosAddress)
    console.log('cosmosAccount:', cosmosAccount)

    const cosmosTxHistory = await adapters.cosmos.getTxHistory({ pubkey: cosmosAddress })
    console.log('cosmosTxHistory:', cosmosTxHistory)

    const cosmosShapeShiftValidator = await (
      adapters.cosmos as cosmossdk.cosmos.ChainAdapter
    ).getValidator('cosmosvaloper199mlc7fr6ll5t54w7tts7f4s0cvnqgc59nmuxf')
    console.log('cosmosShapeShiftValidator:', cosmosShapeShiftValidator)

    await adapters.cosmos.subscribeTxs(
      { wallet, bip44Params: cosmosBip44Params },
      (msg) => console.log(msg),
      (err) => console.log(err)
    )

    // send cosmos example
    try {
      // const value = '99000'

      const feeData = await adapters.cosmos.getFeeData({ sendMax: false })
      const fee = 10 // Increas if taking too long
      const gas = feeData.slow.chainSpecific.gasLimit

      // const cosmosUnsignedTx = await adapters.cosmo.buildSendTransaction({
      //   to: 'cosmos1j26n3mjpwx4f7zz65tzq3mygcr74wp7kcwcner',
      //   value,
      //   wallet,
      //   bip44Params: cosmosBip44Params,
      //   chainSpecific: { gas, fee }
      // })

      // const cosmosUnsignedTx = await (adapters.cosmo as any).claimRewards({
      //   validator: 'cosmosvaloper199mlc7fr6ll5t54w7tts7f4s0cvnqgc59nmuxf', // ShapeShift DAO validator
      //   // value,
      //   wallet,
      //   bip44Params: cosmosBip44Params,
      //   chainSpecific: { gas, fee }
      // })

      const cosmosUnsignedTx = await (adapters.cosmos as any).buildRedelegateTransaction({
        fromValidator: 'cosmosvaloper156gqf9837u7d4c4678yt3rl4ls9c5vuursrrzf', // test validator
        toValidator: 'cosmosvaloper199mlc7fr6ll5t54w7tts7f4s0cvnqgc59nmuxf', // ShapeShift DAO validator
        value: '100000000000',
        wallet,
        txToSign: unsignedTx.txToSign
      })
      if (!adapters.cosmos.signAndBroadcastTransaction) return

      console.log('comsos unsigned tx', JSON.stringify(cosmosUnsignedTx, null, 2))

      const broadcastedTx = await adapters.cosmos.signAndBroadcastTransaction({
        wallet,
        txToSign: cosmosUnsignedTx.txToSign
      })
      console.log('broadcastedTx:', broadcastedTx)
    } catch (err) {
      console.log('cosmosTx error:', err.message)
    }
  } catch (err) {
    console.error(err)
  }
}

main().then(() => console.log('DONE'))
