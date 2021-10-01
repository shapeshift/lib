import { HDWallet } from '@shapeshiftoss/hdwallet-core'
import { ChainAdapterManager } from '@shapeshiftoss/chain-adapters'
import { ExecQuoteInput } from '@shapeshiftoss/types'
import { executeQuote } from './executeQuote'
import { setupQuote } from '../utils/test-data/setupSwapQuote'
import { ZrxSwapperDeps } from '../ZrxSwapper'

describe('executeQuote', () => {
  const { quoteInput, sellAsset } = setupQuote()
  const wallet = <HDWallet>{}
  const adapterManager = <ChainAdapterManager>{}
  const deps = { adapterManager } as unknown as ZrxSwapperDeps

  it('throws an error if quote.success is false', async () => {
    const args = {
      quote: { ...quoteInput, success: false },
      wallet
    }
    await expect(executeQuote(deps, args)).rejects.toThrow(
      'ZrxSwapper:executeQuote Cannot execute a failed quote'
    )
  })

  it('throws an error if sellAsset.network is not provided', async () => {
    const args = {
      quote: { ...quoteInput, sellAsset: { ...sellAsset, network: '' } },
      wallet
    } as unknown as ExecQuoteInput
    await expect(executeQuote(deps, args)).rejects.toThrow(
      'ZrxSwapper:executeQuote sellAssetNetwork and sellAssetSymbol are required'
    )
  })

  it('throws an error if sellAsset.symbol is not provided', async () => {
    const args = {
      quote: { ...quoteInput, sellAsset: { ...sellAsset, symbol: '' } },
      wallet
    }
    await expect(executeQuote(deps, args)).rejects.toThrow(
      'ZrxSwapper:executeQuote sellAssetNetwork and sellAssetSymbol are required'
    )
  })

  it('throws an error if quote.sellAssetAccountId is not provided', async () => {
    const args = {
      quote: { ...quoteInput, sellAssetAccountId: '' },
      wallet
    }
    await expect(executeQuote(deps, args)).rejects.toThrow(
      'ZrxSwapper:executeQuote sellAssetAccountId is required'
    )
  })

  it('throws an error if quote.sellAmount is not provided', () => {
    const args = {
      quote: { ...quoteInput, sellAmount: '' },
      wallet
    }
    expect(executeQuote(deps, args)).rejects.toThrow(
      'ZrxSwapper:executeQuote sellAmount is required'
    )
  })
})
