import { HDWallet } from '@shapeshiftoss/hdwallet-core'
import { chainAdapters } from '@shapeshiftoss/types'
import BigNumber from 'bignumber.js'

import { setupQuote } from '../utils/test-data/setupSwapQuote'
import { chainAdapterMockFuncs, setupZrxDeps } from '../utils/test-data/setupZrxDeps'
import { getSendMaxAmount } from './getSendMaxAmount'

describe('getSendMaxAmount', () => {
  const { web3Instance, adapterManager } = setupZrxDeps()
  const { quoteInput: quote } = setupQuote()
  const deps = { web3: web3Instance, adapterManager }
  const wallet = ({
    ethGetAddress: jest.fn(() => Promise.resolve('0xc770eefad204b5180df6a14ee197d99d808ee52d')),
    ethSignTx: jest.fn(() => Promise.resolve({}))
  } as unknown) as HDWallet

  it('should throw an error if no erc20 asset balance is found', async () => {
    const balance = undefined
    const args = {
      quote: { ...quote, sellAsset: { ...quote.sellAsset, tokenId: 'contractAddress' } },
      wallet,
      sellAssetAccountId: quote.sellAssetAccountId
    }
    ;(adapterManager.byChain as jest.Mock<unknown>).mockReturnValue({
      ...chainAdapterMockFuncs,
      getAccount: jest.fn(() =>
        Promise.resolve({
          chainSpecific: { tokens: [{ contract: 'contractAddress', balance }] }
        })
      )
    })

    await expect(getSendMaxAmount(deps, args)).rejects.toThrow(
      `No balance found for ${quote.sellAsset.symbol}`
    )
  })

  it('should throw an error if no ETH balance is found', async () => {
    const args = {
      quote: { ...quote, sellAsset: { ...quote.sellAsset, tokenId: undefined } },
      wallet,
      sellAssetAccountId: quote.sellAssetAccountId
    }
    ;(adapterManager.byChain as jest.Mock<unknown>).mockReturnValue({
      ...chainAdapterMockFuncs,
      getAccount: jest.fn(() =>
        Promise.resolve({
          balance: undefined
        })
      )
    })

    await expect(getSendMaxAmount(deps, args)).rejects.toThrow(`No balance found for ETH`)
  })

  it('should throw an error if ETH balance is less than the estimated fee', async () => {
    const ethBalance = '100'
    const txFee = '1000'
    const args = {
      quote: { ...quote, sellAsset: { ...quote.sellAsset, tokenId: undefined } },
      wallet,
      sellAssetAccountId: quote.sellAssetAccountId
    }
    ;(adapterManager.byChain as jest.Mock<unknown>).mockReturnValue({
      ...chainAdapterMockFuncs,
      getAccount: jest.fn(() =>
        Promise.resolve({
          balance: ethBalance
        })
      ),
      getFeeData: jest.fn(() =>
        Promise.resolve({
          [chainAdapters.FeeDataKey.Average]: { txFee }
        })
      )
    })

    await expect(getSendMaxAmount(deps, args)).rejects.toThrow(
      'ETH balance is less than estimated fee'
    )
  })

  it('should return max erc20 asset balance if tokenId is provided', async () => {
    const erc20Balance = '100'
    const args = {
      quote: { ...quote, sellAsset: { ...quote.sellAsset, tokenId: 'contractAddress' } },
      wallet,
      sellAssetAccountId: quote.sellAssetAccountId
    }
    ;(adapterManager.byChain as jest.Mock<unknown>).mockReturnValue({
      ...chainAdapterMockFuncs,
      getAccount: jest.fn(() =>
        Promise.resolve({
          chainSpecific: { tokens: [{ contract: 'contractAddress', balance: erc20Balance }] }
        })
      )
    })

    expect(await getSendMaxAmount(deps, args)).toEqual(erc20Balance)
  })

  it('should return max ETH balance in wei (balance minus txFee)', async () => {
    const ethBalance = '1000'
    const txFee = '100'
    const args = {
      quote: { ...quote, sellAsset: { ...quote.sellAsset, tokenId: undefined } },
      wallet,
      sellAssetAccountId: quote.sellAssetAccountId
    }
    ;(adapterManager.byChain as jest.Mock<unknown>).mockReturnValue({
      ...chainAdapterMockFuncs,
      getAccount: jest.fn(() =>
        Promise.resolve({
          balance: ethBalance
        })
      ),
      getFeeData: jest.fn(() =>
        Promise.resolve({
          [chainAdapters.FeeDataKey.Average]: { txFee }
        })
      )
    })

    expect(await getSendMaxAmount(deps, args)).toEqual(
      new BigNumber(ethBalance).minus(txFee).toString()
    )
  })

  it('should return max ETH balance in wei (balance minus txFee) with correct fee data key', async () => {
    const ethBalance = '1000'
    const txFee = '500'
    const args = {
      quote: { ...quote, sellAsset: { ...quote.sellAsset, tokenId: undefined } },
      wallet,
      sellAssetAccountId: quote.sellAssetAccountId,
      feeEstimateKey: chainAdapters.FeeDataKey.Fast
    }
    ;(adapterManager.byChain as jest.Mock<unknown>).mockReturnValue({
      ...chainAdapterMockFuncs,
      getAccount: jest.fn(() =>
        Promise.resolve({
          balance: ethBalance
        })
      ),
      getFeeData: jest.fn(() =>
        Promise.resolve({
          [chainAdapters.FeeDataKey.Fast]: { txFee }
        })
      )
    })

    expect(await getSendMaxAmount(deps, args)).toEqual(
      new BigNumber(ethBalance).minus(txFee).toString()
    )
  })
})
