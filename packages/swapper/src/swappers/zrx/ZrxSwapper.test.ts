import { ChainTypes, ContractTypes, NetworkTypes } from '@shapeshiftoss/asset-service'
import BigNumber from 'bignumber.js'
import { ZrxSwapper } from './ZrxSwapper'
import { zrxService } from './utils'
import { DEFAULT_SLIPPAGE } from '../../utils/constants'

const axios = jest.createMockFromModule('axios')
//@ts-ignore
axios.create = jest.fn(() => axios)
jest.mock('./utils')

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
    sellAmount: '1000000000000000000',
    slippage: DEFAULT_SLIPPAGE
  }
  return { quoteInput, buyAsset, sellAsset }
}

describe('ZrxSwapper', () => {
  describe('getQuote', () => {
    it('returns quote with fee data', async () => {
      const { quoteInput } = setupQuote()
      const swapper = new ZrxSwapper()
      ;(zrxService.get as jest.Mock<unknown>).mockReturnValue(
        Promise.resolve({
          data: { success: true, price: '100', gasPrice: '1000', estimatedGas: '1000000' }
        })
      )
      const quote = await swapper.getQuote(quoteInput)
      expect(quote?.success).toBeTruthy()
      expect(quote?.feeData).toStrictEqual({
        fee: '1500000000',
        estimatedGas: '1500000',
        gasPrice: '1000',
        approvalFee: '100000000'
      })
    })
    it('returns quote without fee data', async () => {
      const { quoteInput } = setupQuote()
      const swapper = new ZrxSwapper()
      ;(zrxService.get as jest.Mock<unknown>).mockReturnValue(
        Promise.resolve({
          data: { success: true, price: '100', gasPrice: '1000' }
        })
      )
      const quote = await swapper.getQuote(quoteInput)
      expect(quote?.success).toBeTruthy()
      expect(quote?.feeData).toStrictEqual({
        fee: '0',
        estimatedGas: '0',
        gasPrice: '1000',
        approvalFee: '100000000'
      })
    })
    it('fails on no sellAmount', async () => {
      const { quoteInput } = setupQuote()
      const swapper = new ZrxSwapper()
      await expect(swapper.getQuote({ ...quoteInput, sellAmount: undefined })).rejects.toThrow(
        'ZrxError:getQuote - sellAmount is required'
      )
    })
    it('slippage is undefined', async () => {
      const { quoteInput } = setupQuote()
      const swapper = new ZrxSwapper()
      ;(zrxService.get as jest.Mock<unknown>).mockReturnValue(
        Promise.resolve({ data: { success: true } })
      )
      const quote = await swapper.getQuote({ ...quoteInput, slippage: undefined })
      expect(quote?.slippage).toBeFalsy()
    })
    it('fails on non ethereum chain for buyAsset', async () => {
      const { quoteInput, buyAsset } = setupQuote()
      const swapper = new ZrxSwapper()
      ;(zrxService.get as jest.Mock<unknown>).mockReturnValue(
        Promise.resolve({ data: { success: false } })
      )
      await expect(
        swapper.getQuote({
          ...quoteInput,
          buyAsset: { ...buyAsset, chain: ChainTypes.Bitcoin }
        })
      ).rejects.toThrow(
        'ZrxError:getQuote - Both assets need to be on the Ethereum chain to use Zrx'
      )
    })
    it('fails on non ethereum chain for sellAsset', async () => {
      const { quoteInput, sellAsset } = setupQuote()
      const swapper = new ZrxSwapper()
      ;(zrxService.get as jest.Mock<unknown>).mockReturnValue(
        Promise.resolve({ data: { success: false } })
      )
      await expect(
        swapper.getQuote({
          ...quoteInput,
          sellAsset: { ...sellAsset, chain: ChainTypes.Bitcoin }
        })
      ).rejects.toThrow(
        'ZrxError:getQuote - Both assets need to be on the Ethereum chain to use Zrx'
      )
    })
    it('uses symbol when weth tokenId is undefined', async () => {
      const { quoteInput, buyAsset } = setupQuote()
      const swapper = new ZrxSwapper()
      ;(zrxService.get as jest.Mock<unknown>).mockReturnValue(
        Promise.resolve({ data: { success: true } })
      )
      const quote = await swapper.getQuote({
        ...quoteInput,
        buyAsset: { ...buyAsset, tokenId: undefined }
      })
      expect(quote?.success).toBeTruthy()
    })
    it('use minQuoteSellAmount when sellAmount is 0', async () => {
      const { quoteInput, sellAsset } = setupQuote()
      const swapper = new ZrxSwapper()
      ;(zrxService.get as jest.Mock<unknown>).mockReturnValue(
        Promise.resolve({ data: { sellAmount: '20000000000000000000' } })
      )
      const minimum = '20'
      const quote = await swapper.getQuote({
        ...quoteInput,
        sellAmount: '0',
        minimum
      })
      expect(quote?.sellAmount).toBe(
        new BigNumber(minimum)
          .times(new BigNumber(10).exponentiatedBy(sellAsset.precision))
          .toString()
      )
    })
    it('normalizedAmount returns undefined when amount is 0', async () => {
      const { quoteInput } = setupQuote()
      const swapper = new ZrxSwapper()
      await expect(
        swapper.getQuote({
          ...quoteInput,
          sellAmount: '0',
          minimum: undefined
        })
      ).rejects.toThrow('ZrxError:getQuote - Must have valid sellAmount or minimum amount')
    })
  })
})
