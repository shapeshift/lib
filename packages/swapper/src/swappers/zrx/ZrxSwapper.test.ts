import { ChainTypes, ContractTypes, NetworkTypes } from '@shapeshiftoss/asset-service'
import { ZrxSwapper } from './ZrxSwapper'

const setupQuote = () => {
  const sellAsset = {
    name: 'Fox',
    chain: ChainTypes.Ethereum,
    network: NetworkTypes.MAINNET,
    precision: 18,
    tokenId: '0xc770eefad204b5180df6a14ee197d99d808ee52d',
    contractType: ContractTypes.ERC20,
    color: '#FFFFFF',
    secondaryColor: '#FFFFFF',
    icon: 'https://assets.coincap.io/assets/icons/fox@2x.png',
    sendSupport: true,
    receiveSupport: true,
    symbol: 'FOX'
  }
  const buyAsset = {
    name: 'WETH',
    chain: ChainTypes.Ethereum,
    network: NetworkTypes.MAINNET,
    precision: 18,
    tokenId: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    contractType: ContractTypes.ERC20,
    color: '#FFFFFF',
    secondaryColor: '#FFFFFF',
    icon: 'https://assets.coingecko.com/coins/images/2518/thumb/weth.png?1628852295',
    explorer: 'https://etherscan.io',
    explorerTxLink: 'https://etherscan.io/tx/',
    sendSupport: true,
    receiveSupport: true,
    symbol: 'WETH'
  }

  const quoteInput = {
    sellAsset,
    buyAsset,
    sellAmount: '1000000000000000000'
  }
  return { quoteInput, buyAsset, sellAsset }
}

describe('ZrxSwapper', () => {
  describe('getQuote', () => {
    const { quoteInput, sellAsset, buyAsset } = setupQuote()
    const swapper = new ZrxSwapper()
    it('returns quote', async () => {
      const quote = await swapper.getQuote(quoteInput)
      expect(quote?.success).toBeTruthy()
    })
    it('fails on no sellAmount', async () => {
      try {
        await swapper.getQuote({ ...quoteInput, sellAmount: undefined })
      } catch (e) {
        expect(e).toBeTruthy()
      }
    })
    it('fails on no sellAmount', async () => {
      try {
        await swapper.getQuote({ ...quoteInput, sellAmount: undefined })
      } catch (e) {
        expect(e).toBeTruthy()
      }
    })
    it('fails on non ethereum chain for sellAsset', async () => {
      try {
        await swapper.getQuote({
          ...quoteInput,
          sellAsset: { ...sellAsset, chain: ChainTypes.Litecoin }
        })
      } catch (e) {
        expect(e).toBeTruthy()
      }
    })
    it('fails on non ethereum chain for buyAsseasdfasdft', async () => {
      swapper.normalize
    })
  })
})
