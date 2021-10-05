import Web3 from 'web3'
import { HDWallet } from '@shapeshiftoss/hdwallet-core'
import { ChainTypes } from '@shapeshiftoss/types'
import { ChainAdapterManager } from '@shapeshiftoss/chain-adapters'
import { approvalNeeded } from './approvalNeeded'
import { setupQuote } from '../utils/test-data/setupSwapQuote'

const setup = () => {
  const unchainedUrls = {
    [ChainTypes.Ethereum]: 'http://localhost:31300/api/v1'
  }
  const ethNodeUrl = 'http://localhost:1000'
  const adapterManager = new ChainAdapterManager(unchainedUrls)
  const web3Provider = new Web3.providers.HttpProvider(ethNodeUrl)
  const web3 = new Web3(web3Provider)

  return { web3, adapterManager }
}

describe('approvalNeeded', () => {
  const args = setup()
  const wallet = <HDWallet>{}
  const { quoteInput, sellAsset } = setupQuote()

  it('returns false if sellAsset symbol is ETH', async () => {
    const input = { quote: { ...quoteInput, sellAsset: { ...sellAsset, symbol: 'ETH' } }, wallet }

    expect(await approvalNeeded(args, input)).toEqual({ approvalNeeded: false })
  })
})
