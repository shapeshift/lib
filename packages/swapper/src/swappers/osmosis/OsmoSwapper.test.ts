/*
    osmo Swapper
 */
// import { ChainAdapterManager } from '@shapeshiftoss/chain-adapters'
// import { HDWallet } from '@shapeshiftoss/hdwallet-core'
import { SwapperType } from '@shapeshiftoss/types'

import { OsmoSwapper } from '../..'
// import { getRateInfo } from './OsmoService'
import { setupQuote } from './test-data/setupSwapQuote'

describe('OsmoSwapper', () => {
  // const sellAmount = '1000000000000000000'
  // const input = <GetQuoteInput>{}
  // const wallet = <HDWallet>{}
  // const quote = <Quote<ChainTypes>>{}

  // const swapperDeps = {
  //   adapterManager: <ChainAdapterManager>{}
  // }

  it('is true', () => {
    expect(true).toBeTruthy()
  })

  //get Quote
  it('Get Quote', async () => {
    const { quoteInput } = setupQuote()
    console.log('quoteInput: ', quoteInput)
    const swapper = new OsmoSwapper()
    //TODO mocking
    // ;(zrxService.get as jest.Mock<unknown>).mockReturnValue(
    //     Promise.resolve({
    //       data: { success: true, price: '100', gasPrice: '1000', estimatedGas: '1000000' }
    //     })
    // )
    //
    const quoteResp = await swapper.getQuote(quoteInput)
    console.log('(output) quote: buy amount ', quoteResp.buyAmount)
    console.log('(output) quote: buy rate ', quoteResp.rate)

    expect(quoteResp.success).toBeTruthy()

    //TODO hardcode to mock
    // expect(quote.feeData).toStrictEqual({
    //   fee: '1500000000',
    //   chainSpecific: {
    //     estimatedGas: '1500000',
    //     gasPrice: '1000',
    //     approvalFee: '100000000'
    //   }
    // })
    // expect(quote.rate).toBe('100')
  })

  it('returns Zrx type', () => {
    const swapper = new OsmoSwapper()
    const type = swapper.getType()
    expect(type).toBe(SwapperType.Osmosis)
  })

  //TODO is this needed? because not eth
  // it('Builds quote Tx', () => {
  //   const swapper = new OsmoSwapper()
  //   const type = swapper.getType()
  //
  //   const args = { input, wallet }
  //   await swapper.buildQuoteTx(args)
  //
  //   //
  // })

  // it('executeQuote quote Tx', async () => {
  //   const swapper = new OsmoSwapper()
  //
  //   const args = { quote, wallet }
  //   const resp = await swapper.executeQuote(args)
  //
  //   //
  //   console.log('resp: ', resp)
  // })
})
