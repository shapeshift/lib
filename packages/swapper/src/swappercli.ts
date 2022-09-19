import { AssetService } from '@shapeshiftoss/asset-service'
import { ChainId } from '@shapeshiftoss/caip'
import {
  bitcoin,
  ChainAdapter,
  ChainAdapterManager,
  cosmos,
  CosmosSdkChainId,
  ethereum,
  thorchain,
} from '@shapeshiftoss/chain-adapters'
import { NativeAdapterArgs, NativeHDWallet } from '@shapeshiftoss/hdwallet-native'
import { KnownChainIds } from '@shapeshiftoss/types'
import * as unchained from '@shapeshiftoss/unchained-client'
import BigNumber from 'bignumber.js'
import dotenv from 'dotenv'
import readline from 'readline-sync'
import Web3 from 'web3'

import { SwapperManager } from './manager/SwapperManager'
import { ThorchainSwapper, ThorchainSwapperDeps } from './swappers'
import { ZrxSwapper } from './swappers/zrx/ZrxSwapper'

dotenv.config()

const {
  UNCHAINED_ETH_HTTPS_API = 'http://localhost:31300',
  UNCHAINED_ETH_WS_API = 'wss://localhost:31300',
  UNCHAINED_BTC_HTTPS_API = 'http://localhost:31300',
  UNCHAINED_BTC_WS_API = 'wss://localhost:31300',
  UNCHAINED_LTC_HTTPS_API = 'http://localhost:31300',
  UNCHAINED_LTC_WS_API = 'wss://localhost:31300',
  UNCHAINED_RUNE_HTTPS_API = 'http://localhost:31300',
  UNCHAINED_RUNE_WS_API = 'wss://localhost:31300',
  UNCHAINED_ATOM_HTTPS_API = 'http://localhost:31300',
  UNCHAINED_ATOM_WS_API = 'wss://localhost:31300',
  ETH_NODE_URL = 'http://localhost:3000',
  MIDGARD_URL = 'https://midgard.ninerealms.com/v2', // 'https://indexer.thorchain.shapeshift.com',
  DEVICE_ID = 'device123',
  MNEMONIC = 'all all all all all all all all all all all all',
} = process.env

const toBaseUnit = (amount: BigNumber | string, precision: number): string => {
  return new BigNumber(amount)
    .multipliedBy(new BigNumber(10).exponentiatedBy(new BigNumber(precision)))
    .toString()
}

const fromBaseUnit = (amount: BigNumber | string, precision: number): string => {
  return new BigNumber(amount).times(new BigNumber(10).exponentiatedBy(precision * -1)).toString()
}

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
  const [, , ...args] = process.argv
  const [sellSymbol, buySymbol, sellAmount] = args

  console.info(`sell ${sellAmount} of ${sellSymbol} to ${buySymbol}`)

  if (!sellAmount || !sellSymbol || !buySymbol) {
    console.error(`
      Usage:
      swapcli [sellSymbol] [buySymbol] [sellAmount](denominated in sell asset, not wei)
    `)
    return
  }

  const assetService = new AssetService()
  const assetMap = assetService.getAll()

  const sellAsset = assetMap[sellSymbol]
  const buyAsset = assetMap[buySymbol]

  if (!sellAsset) {
    console.error(`No asset ${sellSymbol} found in asset service`)
    return
  }
  if (!buyAsset) {
    console.error(`No asset ${buySymbol} found in asset service`)
    return
  }

  // Swapper Deps
  const wallet = await getWallet()

  const ethChainAdapter = new ethereum.ChainAdapter({
    providers: {
      ws: new unchained.ws.Client<unchained.ethereum.Tx>(UNCHAINED_ETH_WS_API),
      http: new unchained.ethereum.V1Api(
        new unchained.ethereum.Configuration({
          basePath: UNCHAINED_ETH_HTTPS_API,
        }),
      ),
    },
    rpcUrl: 'https://mainnet.infura.io/v3/d734c7eebcdf400185d7eb67322a7e57',
  })

  const btcAdapterArgs = {
    coinName: 'bitcoin',
    providers: {
      ws: new unchained.ws.Client<unchained.bitcoin.Tx>(UNCHAINED_BTC_WS_API),
      http: new unchained.bitcoin.V1Api(
        new unchained.bitcoin.Configuration({
          basePath: UNCHAINED_BTC_HTTPS_API,
        }),
      ),
    },
  }
  const bitcoinChainAdapter = new bitcoin.ChainAdapter(btcAdapterArgs)

  const ltcAdapterArgs = {
    coinName: 'litecoin',
    providers: {
      ws: new unchained.ws.Client<unchained.bitcoin.Tx>(UNCHAINED_LTC_WS_API),
      http: new unchained.bitcoin.V1Api(
        new unchained.bitcoin.Configuration({
          basePath: UNCHAINED_LTC_HTTPS_API,
        }),
      ),
    },
  }
  const litecoinChainAdapter = new bitcoin.ChainAdapter(ltcAdapterArgs)

  const runeAdapterArgs = {
    coinName: 'rune',
    providers: {
      ws: new unchained.ws.Client<unchained.thorchain.Tx>(UNCHAINED_RUNE_WS_API),
      http: new unchained.thorchain.V1Api(
        new unchained.thorchain.Configuration({
          basePath: UNCHAINED_RUNE_HTTPS_API,
        }),
      ),
    },
  }
  const thorchainChainAdapter = new thorchain.ChainAdapter(runeAdapterArgs)

  const cosmosAdapterArgs = {
    coinName: 'atom',
    providers: {
      ws: new unchained.ws.Client<unchained.thorchain.Tx>(UNCHAINED_ATOM_WS_API),
      http: new unchained.thorchain.V1Api(
        new unchained.thorchain.Configuration({
          basePath: UNCHAINED_ATOM_HTTPS_API,
        }),
      ),
    },
  }
  const cosmosChainAdapter = new cosmos.ChainAdapter(cosmosAdapterArgs)

  const web3Provider = new Web3.providers.HttpProvider(ETH_NODE_URL)
  const web3 = new Web3(web3Provider)
  const zrxSwapperDeps = { wallet, adapter: ethChainAdapter, web3 }
  const manager = new SwapperManager()
  const zrxSwapper = new ZrxSwapper(zrxSwapperDeps)
  manager.addSwapper(zrxSwapper)

  const adapterManager: ChainAdapterManager = new Map()
  adapterManager.set(
    KnownChainIds.BitcoinMainnet,
    bitcoinChainAdapter as unknown as ChainAdapter<ChainId>,
  )
  adapterManager.set(
    KnownChainIds.EthereumMainnet,
    ethChainAdapter as unknown as ChainAdapter<ChainId>,
  )
  adapterManager.set(
    KnownChainIds.ThorchainMainnet,
    thorchainChainAdapter as unknown as ChainAdapter<ChainId>,
  )
  adapterManager.set(
    KnownChainIds.LitecoinMainnet,
    litecoinChainAdapter as unknown as ChainAdapter<ChainId>,
  )
  adapterManager.set(
    KnownChainIds.CosmosMainnet,
    cosmosChainAdapter as unknown as ChainAdapter<ChainId>,
  )

  const tcDeps: ThorchainSwapperDeps = { midgardUrl: MIDGARD_URL, web3, adapterManager }
  const tc = new ThorchainSwapper(tcDeps)
  await tc.initialize()
  manager.addSwapper(tc)

  const swapper = await manager.getBestSwapper({
    sellAssetId: sellAsset.assetId,
    buyAssetId: buyAsset.assetId,
  })

  console.info(
    `bestSwapper for ${sellAsset.assetId} to ${buyAsset.assetId} is ${swapper?.getType()}`,
  )
  if (!swapper) {
    console.warn(`no swapper found for specified assets`)
    return
  }

  const sellAmountBase = toBaseUnit(sellAmount, sellAsset.precision)

  let quote
  try {
    quote = await swapper.getTradeQuote({
      chainId: sellAsset.chainId as CosmosSdkChainId, // wtf?
      sellAsset,
      buyAsset,
      sellAmount: sellAmountBase,
      sellAssetAccountNumber: 0,
      sendMax: false,
      receiveAddress: 'MAED8eG4utBqhkyNjvoDZB7PoAv7XHroCA',
    })
  } catch (e) {
    console.error(e)
  }

  if (!quote) {
    console.warn('no quote returned')
    return
  }

  console.info('quote = ', JSON.stringify(quote))

  const buyAmount = fromBaseUnit(quote.buyAmount || '0', buyAsset.precision)

  const answer = readline.question(
    `Swap ${sellAmount} ${sellAsset.symbol} for ${buyAmount} ${
      buyAsset.symbol
    } on ${swapper.getType()}? (y/n): `,
  )
  if (answer === 'y') {
    const trade = await swapper.buildTrade({
      chainId: sellAsset.chainId as CosmosSdkChainId,
      wallet,
      buyAsset,
      sendMax: false,
      sellAmount: sellAmountBase,
      sellAsset,
      sellAssetAccountNumber: 0,
      receiveAddress: 'MAED8eG4utBqhkyNjvoDZB7PoAv7XHroCA',
    })
    console.info('trade: ', JSON.stringify(trade))
    const txid = await swapper.executeTrade({ trade, wallet })
    console.info('broadcast tx with id: ', txid)
  }
}

main().then(() => console.info('Done'))
