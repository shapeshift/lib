import dotenv from 'dotenv'
import { bnOrZero } from './utils'
import { IdleInvestor } from './IdleInvestor'
import { ethereum } from '@shapeshiftoss/chain-adapters'
import * as unchained from '@shapeshiftoss/unchained-client'
import { NativeAdapterArgs, NativeHDWallet } from '@shapeshiftoss/hdwallet-native'

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
  const wallet = await getWallet()
  const chainAdapter = new ethereum.ChainAdapter({
    providers: {
      ws: new unchained.ws.Client<unchained.ethereum.EthereumTx>(
        'wss://dev-api.ethereum.shapeshift.com'
      ),
      http: new unchained.ethereum.V1Api(
        new unchained.ethereum.Configuration({
          basePath: 'https://dev-api.ethereum.shapeshift.com'
        })
      )
    },
    rpcUrl: 'https://mainnet.infura.io/v3/d734c7eebcdf400185d7eb67322a7e57'
  })

  const idleInvestor = new IdleInvestor({
    providerUrl: 'https://daemon.ethereum.shapeshift.com',
    dryRun: true,
    chainAdapter,
    network: 1
  })

  const address = '0x442Aea0Fd2AFbd3391DAE768F7046f132F0a6300'
  const usdcCaip19 = 'eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'.toLowerCase()

  await idleInvestor.initialize()

  const allOpportunities = await idleInvestor.findAll()

  const usdcOpportunities = await idleInvestor.findByUnderlyingAssetId(usdcCaip19)
  const opportunity = usdcOpportunities[1]

  const allowance = await opportunity.allowance(address)
  const approvalPreparedTx = await opportunity.prepareApprove(address)
  const withdrawPreparedTx = await opportunity.prepareDeposit({ address, amount: bnOrZero(1000) })
  const depositPreparedTx = await opportunity.prepareWithdrawal({ address, amount: bnOrZero(1000) })

  const signedTx = await opportunity.signAndBroadcast({
    wallet,
    tx: depositPreparedTx,
    feePriority: 'fast'
  })
  console.info(
    JSON.stringify(
      {
        allOpportunities,
        opportunity,
        allowance,
        approvalPreparedTx,
        depositPreparedTx,
        withdrawPreparedTx,
        signedTx
      },
      null,
      2
    )
  )
}

main()
  .then(() => console.info('Exit'))
  .catch((e) => {
    console.error(e), process.exit(1)
  })
