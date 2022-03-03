import { ChainAdapterManager } from '@shapeshiftoss/chain-adapters'
import { ChainTypes } from '@shapeshiftoss/types'
import BigNumber from 'bignumber.js'
import dotenv from 'dotenv'
import readline from 'readline-sync'
import Web3 from 'web3'
import { FoxyApi } from './api'
import { foxyContractAddress } from './constants'

dotenv.config()

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

  const api = new FoxyApi({
    adapter: adapterManager.byChain(ChainTypes.Ethereum), // adapter is an ETH @shapeshiftoss/chain-adapters
    providerUrl: 'http://127.0.0.1:8545'
  })

  console.log('try')
  const totalSupply = await api.totalSupply({ contractAddress: foxyContractAddress })
  console.log('total', totalSupply)

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
