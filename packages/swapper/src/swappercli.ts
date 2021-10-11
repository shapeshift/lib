import dotenv from 'dotenv'
import readline from 'readline-sync'
import Web3 from 'web3'
import BigNumber from 'bignumber.js'

import { Asset, NetworkTypes, SwapperType } from '@shapeshiftoss/types'
import { NativeAdapterArgs, NativeHDWallet } from '@shapeshiftoss/hdwallet-native'
import { ChainAdapterManager } from '@shapeshiftoss/chain-adapters'
import { AssetService } from '@shapeshiftoss/asset-service'
import { SwapperManager } from './manager/SwapperManager'
import { ZrxSwapper } from './swappers/zrx/ZrxSwapper'

dotenv.config()

const {
  UNCHAINED_API = 'http://localhost:31300/api/v1',
  ETH_NODE_URL = 'http://localhost',
  DEVICE_ID = 'device123',
  MNEMONIC = 'salon adapt foil saddle orient make page zero cheese marble test catalog'
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
    deviceId: DEVICE_ID
  }
  const wallet = new NativeHDWallet(nativeAdapterArgs)
  await wallet.initialize()

  return wallet
}

const main = async (): Promise<void> => {
  const [_, __, ...args] = process.argv
  const [sellSymbol, buySymbol, sellAmount] = args
  console.info(`sellSymbol: sell ${sellAmount} of ${sellSymbol} to ${buySymbol}`)
  if (!sellAmount || !sellSymbol || !buySymbol) {
    console.error(`
      Usage:
      swapcli [sellSymbol] [buySymbol] [sellAmount]
    `)
    return
  }

  const assetService = new AssetService()
  await assetService.initialize()
  const assets = assetService.byNetwork(NetworkTypes.MAINNET)

  if (!assets) {
    console.error('No portfolio assets found')
    return
  }

  const assetMap = assets.reduce((acc, val) => {
    if (val) {
      acc[val.symbol] = val
    }
    return acc
  }, {} as Record<string, unknown>)

  const sellAsset = assetMap[sellSymbol] as Asset
  const buyAsset = assetMap[buySymbol] as Asset

  if (!sellAsset) {
    console.error(`No asset ${sellSymbol} found in portfolio`)
    return
  }
  if (!buyAsset) {
    console.error(`No asset ${buySymbol} found in portfolio`)
  }

  const wallet = await getWallet()
  const adapterManager = new ChainAdapterManager({ ethereum: UNCHAINED_API })
  const web3Provider = new Web3.providers.HttpProvider(ETH_NODE_URL)
  const web3 = new Web3(web3Provider)

  const zrxSwapperDeps = { wallet, adapterManager, web3 }

  const zrxSwapper = new ZrxSwapper(zrxSwapperDeps)
  const manager = new SwapperManager()

  manager.addSwapper(SwapperType.Zrx, zrxSwapper)
  const swapper = manager.getSwapper(SwapperType.Zrx)
  const sellAmountBase = toBaseUnit(sellAmount, sellAsset.precision)

  const quote = await swapper.getQuote({
    sellAsset,
    buyAsset,
    sellAmount: sellAmountBase
  })

  console.info('quote = ', JSON.stringify(quote))

  if (!quote.success) {
    console.error('Obtaining the quote failed: ', quote.statusReason)
    return
  }

  const buyAmount = fromBaseUnit(quote.buyAmount || '0', buyAsset.precision)

  const answer = readline.question(
    `Swap ${sellAmount} ${sellAsset.symbol} for ${buyAmount} ${
      buyAsset.symbol
    } on ${swapper.getType()}? (y/n): `
  )
  if (answer === 'y') {
    const txid = await swapper.executeQuote({ quote, wallet })
    console.info('broadcast tx with id: ', txid)
  }
}

main().then(() => console.info('Done'))
