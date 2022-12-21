import { osmosis } from '@shapeshiftoss/chain-adapters'
import { NativeAdapterArgs, NativeHDWallet } from '@shapeshiftoss/hdwallet-native'
import * as unchained from '@shapeshiftoss/unchained-client'
import dotenv from 'dotenv'

import { OsmosisInvestor } from './OsmosisInvestor'
import { bn } from './utils'

dotenv.config()

const { DEVICE_ID = 'device123', MNEMONIC } = process.env

const getWallet = async (): Promise<NativeHDWallet> => {
  if (!MNEMONIC) {
    throw new Error('Cannot init native wallet without mnemonic')
  }
  const nativeAdapterArgs: NativeAdapterArgs = {
    mnemonic: MNEMONIC,
    deviceId: DEVICE_ID,
  }
  const wallet = new NativeHDWallet(nativeAdapterArgs)
  await wallet.initialize()

  return wallet
}

const main = async (): Promise<void> => {
  const wallet = await getWallet()
  const chainAdapter = new osmosis.ChainAdapter({
    providers: {
      ws: new unchained.ws.Client<unchained.osmosis.Tx>('wss://dev-api.osmosis.shapeshift.com'),
      http: new unchained.osmosis.V1Api(
        new unchained.osmosis.Configuration({
          basePath: 'https://dev-api.osmosis.shapeshift.com',
        }),
      ),
    },
    coinName: 'Osmosis',
  })

  const osmosisInvestor = new OsmosisInvestor({
    providerUrl: 'https://daemon.osmosis.shapeshift.com',
    dryRun: true,
    chainAdapter,
  })

  const address = 'cosmos15cenya0tr7nm3tz2wn3h3zwkht2rxrq7q7h3dj'
  const atomCaip19 = 'cosmos:cosmoshub-4/slip44:118'.toLowerCase()

  await osmosisInvestor.initialize()

  const allOpportunities = await osmosisInvestor.findAll()

  const atomOpportunities = await osmosisInvestor.findByUnderlyingAssetId(atomCaip19)
  const opportunity = atomOpportunities[1]

  const depositPreparedTx = await opportunity.prepareDeposit({ address, amount: bn(1000) })
  const withdrawPreparedTx = await opportunity.prepareWithdrawal({ address, amount: bn(1000) })
  const bip44Params = chainAdapter.getBIP44Params({ accountNumber: 0 })

  const signedTx = await opportunity.signAndBroadcast({
    wallet,
    tx: depositPreparedTx,
    feePriority: 'fast',
    bip44Params,
  })
  console.info(
    JSON.stringify(
      {
        allOpportunities,
        opportunity,
        depositPreparedTx,
        withdrawPreparedTx,
        signedTx,
      },
      null,
      2,
    ),
  )
}

main()
  .then(() => console.info('Exit'))
  .catch((e) => {
    console.error(e), process.exit(1)
  })
