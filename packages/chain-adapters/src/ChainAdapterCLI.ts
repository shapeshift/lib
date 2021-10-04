import { ChainAdapterManager } from './ChainAdapterManager'
import { ChainIdentifier } from '.'
import { NativeAdapterArgs, NativeHDWallet } from '@shapeshiftoss/hdwallet-native'
import { HDWallet, BTCInputScriptType, kavaDescribePath } from '@shapeshiftoss/hdwallet-core'
import dotenv from 'dotenv'
dotenv.config()

// const foxContractAddress = '0xc770eefad204b5180df6a14ee197d99d808ee52d'
const defaultEthPath = `m/44'/60'/0'/0/0`
const defaultBtcPath = `m/44'/0'/0'/0/0`

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
  [ChainIdentifier.Bitcoin]: 'http://localhost:31300',
  [ChainIdentifier.Ethereum]: 'http://localhost:31300'
}

const main = async () => {
  try {
    const chainAdapterManager = new ChainAdapterManager(unchainedUrls)
    const wallet = await getWallet()
    const btcChainAdapter = chainAdapterManager.byChain(ChainIdentifier.Bitcoin)

    const address = await btcChainAdapter.getAddress({
      wallet,
      purpose: 84,
      account: 0,
      isChange: false,
      scriptType: BTCInputScriptType.SpendWitness
      // index: 10
    })
    console.log('address: ', address)

    const txInput = {
      asset: { id: '123', symbol: 'BTC' },
      recipients: [{ address: 'bc1qppzsgs9pt63cx9x994wf4e3qrpta0nm6htk9v4', value: 400 }],
      wallet,
      fee: '60',
      opReturnData: 'sup fool'
    }

    const unsignedTx: any = await btcChainAdapter.buildSendTransaction(txInput)

    const signedTx = await btcChainAdapter.signTransaction({
      wallet,
      txToSign: unsignedTx.txToSign
    })

    console.log('signedTx: ', signedTx)

    // const txid = await btcChainAdapter.broadcastTransaction(signedTx)
    // console.log('txid: ', txid)

    // const balanceInfo = await btcChainAdapter.getAccount(address)
    // console.log('balanceInfo: ', balanceInfo)
    // const txHistory = await btcChainAdapter.getTxHistory(address)
    // console.log('txHistory: ', txHistory)
    // console.dir({ txHistory }, { color: true, depth: 4 })

    //    console.log('Wallet address is', address)

    // // // send eth example
    // const unsignedTx = await ethChainAdapter.buildSendTransaction({
    //   to: `0x47CB53752e5dc0A972440dA127DCA9FBA6C2Ab6F`,
    //   value: '1',
    //   wallet,
    //   path: defaultEthPath
    // })

    // send fox example (erc20)
    // const tx = await ethChainAdapter.buildSendTransaction({
    //   to: `0x47CB53752e5dc0A972440dA127DCA9FBA6C2Ab6F`,
    //   value: '1',
    //   wallet,
    //   path: defaultEthPath,
    //   erc20ContractAddress: foxContractAddress
    // })

    // console.log({ unsignedTx })

    // const signedTx = await ethChainAdapter.signTransaction({ wallet, txToSign: unsignedTx })

    // await ethChainAdapter.broadcastTransaction(signedTx)
    // console.log({ signedTx })
  } catch (err) {
    console.error(err)
  }
}

main().then(() => console.log('DONE'))
