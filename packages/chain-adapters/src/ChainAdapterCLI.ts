import { NativeAdapterArgs, NativeHDWallet } from '@shapeshiftoss/hdwallet-native'
import { BIP44Params, ChainTypes, UtxoAccountType } from '@shapeshiftoss/types'
import dotenv from 'dotenv'

import { ChainAdapterManager } from './ChainAdapterManager'

dotenv.config()

const foxContractAddress = '0xc770eefad204b5180df6a14ee197d99d808ee52d'

const getWallet = async (): Promise<NativeHDWallet> => {
  const nativeAdapterArgs: NativeAdapterArgs = {
    mnemonic: process.env.CLI_MNEMONIC,
    deviceId: 'test'
  }
  const wallet = new NativeHDWallet(nativeAdapterArgs)
  await wallet.initialize()

  return wallet
}

const unchainedUrls = {
  [ChainTypes.Bitcoin]: {
    httpUrl: 'https://dev-api.bitcoin.shapeshift.com',
    wsUrl: 'wss://dev-api.bitcoin.shapeshift.com'
  },
  [ChainTypes.Ethereum]: {
    httpUrl: 'https://dev-api.ethereum.shapeshift.com',
    wsUrl: 'wss://dev-api.ethereum.shapeshift.com'
  },
  [ChainTypes.Cosmos]: {
    httpUrl: 'https://dev-api.cosmos.shapeshift.com',
    wsUrl: 'wss://dev-api.cosmos.shapeshift.com'
  }
}

const main = async () => {
  try {
    const chainAdapterManager = new ChainAdapterManager(unchainedUrls)
    const wallet = await getWallet()
    await wallet.wipe()
    await wallet.loadDevice({
      mnemonic: 'all all all all all all all all all all all all',
      label: 'test',
      skipChecksum: true
    })

    /** BITCOIN CLI */
    const btcChainAdapter = chainAdapterManager.byChain(ChainTypes.Bitcoin)
    const btcBip44Params: BIP44Params = {
      purpose: 84,
      coinType: 0,
      accountNumber: 0,
      isChange: false,
      index: 10
    }

    const btcAddress = await btcChainAdapter.getAddress({
      wallet,
      bip44Params: btcBip44Params,
      accountType: UtxoAccountType.SegwitNative
    })
    console.log('btcAddress:', btcAddress)

    const btcAccount = await btcChainAdapter.getAccount(btcAddress)
    console.log('btcAccount:', btcAccount)

    await btcChainAdapter.subscribeTxs(
      { wallet, bip44Params: btcBip44Params, accountType: UtxoAccountType.SegwitNative },
      (msg) => console.log(msg),
      (err) => console.log(err)
    )

    const txInput = {
      to: 'bc1qppzsgs9pt63cx9x994wf4e3qrpta0nm6htk9v4',
      value: '400',
      wallet,
      bip44Params: btcBip44Params,
      chainSpecific: { accountType: UtxoAccountType.P2pkh, satoshiPerByte: '4' }
    }

    try {
      const btcUnsignedTx = await btcChainAdapter.buildSendTransaction(txInput)
      const btcSignedTx = await btcChainAdapter.signTransaction({
        wallet,
        txToSign: btcUnsignedTx.txToSign
      })
      console.log('btcSignedTx:', btcSignedTx)
      // const btcTxID = await btcChainAdapter.broadcastTransaction(btcSignedTx)
      // console.log('btcTxID: ', btcTxID)
    } catch (err) {
      console.log('btcTx error:', err.message)
    }

    /** ETHEREUM CLI */
    const ethChainAdapter = chainAdapterManager.byChain(ChainTypes.Ethereum)
    const ethBip44Params: BIP44Params = { purpose: 44, coinType: 60, accountNumber: 0 }

    const ethAddress = await ethChainAdapter.getAddress({ wallet, bip44Params: ethBip44Params })
    console.log('ethAddress:', ethAddress)

    const ethAccount = await ethChainAdapter.getAccount(ethAddress)
    console.log('ethAccount:', ethAccount)

    await ethChainAdapter.subscribeTxs(
      { wallet, bip44Params: ethBip44Params },
      (msg) => console.log(msg),
      (err) => console.log(err)
    )

    // estimate gas fees
    try {
      const feeData = await ethChainAdapter.getFeeData({
        to: '0x642F4Bda144C63f6DC47EE0fDfbac0a193e2eDb7',
        value: '123',
        chainSpecific: {
          from: '0x0000000000000000000000000000000000000000',
          contractData: '0x'
        }
      })
      console.log('getFeeData', feeData)
    } catch (err) {
      console.log('getFeeDataError:', err.message)
    }

    // send eth example
    try {
      const ethUnsignedTx = await ethChainAdapter.buildSendTransaction({
        to: `0x47CB53752e5dc0A972440dA127DCA9FBA6C2Ab6F`,
        value: '1',
        wallet,
        bip44Params: ethBip44Params,
        chainSpecific: { gasPrice: '0', gasLimit: '0' }
      })
      const ethSignedTx = await ethChainAdapter.signTransaction({
        wallet,
        txToSign: ethUnsignedTx.txToSign
      })
      console.log('ethSignedTx:', ethSignedTx)
      // const ethTxID = await ethChainAdapter.broadcastTransaction(ethSignedTx)
      // console.log('ethTxID:', ethTxID)
    } catch (err) {
      console.log('ethTx error:', err.message)
    }

    // send fox example (erc20)
    try {
      const erc20UnsignedTx = await ethChainAdapter.buildSendTransaction({
        to: `0x47CB53752e5dc0A972440dA127DCA9FBA6C2Ab6F`,
        value: '1',
        wallet,
        bip44Params: ethBip44Params,
        chainSpecific: { gasPrice: '0', gasLimit: '0', erc20ContractAddress: foxContractAddress }
      })
      const erc20SignedTx = await ethChainAdapter.signTransaction({
        wallet,
        txToSign: erc20UnsignedTx.txToSign
      })
      console.log('erc20SignedTx:', erc20SignedTx)

      //const erc20TxID = await ethChainAdapter.broadcastTransaction(erc20SignedTx)
      //console.log('erc20TxID:', erc20TxID)
    } catch (err) {
      console.log('erc20Tx error:', err.message)
    }

    /** COSMOS CLI */
    const cosmosChainAdapter = chainAdapterManager.byChain(ChainTypes.Cosmos)
    const cosmosBip44Params: BIP44Params = { purpose: 44, coinType: 118, accountNumber: 0 }

    const cosmosAddress = await cosmosChainAdapter.getAddress({
      wallet,
      bip44Params: cosmosBip44Params
    })
    console.log('cosmosAddress:', cosmosAddress)

    const cosmosAccount = await cosmosChainAdapter.getAccount('cosmos1zjk9dkhzz2waxmtvtl3hnnl0t3ac0k5urlyk7s')
    console.log(cosmosAccount)

    const txHistory = await cosmosChainAdapter.getTxHistory({
      pubkey: 'cosmos1zjk9dkhzz2waxmtvtl3hnnl0t3ac0k5urlyk7s'
    })
    console.log(txHistory)
    await cosmosChainAdapter.subscribeTxs(
      { wallet, bip44Params: cosmosBip44Params },
      (msg) => console.log(msg),
      (err) => console.log(err)
    )

    // send cosmos example
    try {
      const cosmosUnsignedTx = await cosmosChainAdapter.buildSendTransaction({
        to: `0x47CB53752e5dc0A972440dA127DCA9FBA6C2Ab6F`,
        value: '1',
        wallet,
        bip44Params: cosmosBip44Params,
        chainSpecific: { gas: '0' }
      })
      const cosmosSignedTx = await cosmosChainAdapter.signTransaction({
        wallet,
        txToSign: cosmosUnsignedTx.txToSign
      })
      console.log('cosmosSignedTx:', cosmosSignedTx)

      // const cosmosTxID = await cosmosChainAdapter.broadcastTransaction(cosmosSignedTx)
      // console.log('cosmosTxID:', cosmosTxID)
    } catch (err) {
      console.log('cosmosTx error:', err.message)
    }
  } catch (err) {
    console.error(err)
  }
}

main().then(() => console.log('DONE'))
