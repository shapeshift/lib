import BigNumber from 'bignumber.js'
import { chainAdapters } from '@shapeshiftoss/types'
import { HDWallet } from '@shapeshiftoss/hdwallet-core'
import { getSendMaxAmount } from './getSendMaxAmount'
import { setupZrxDeps, chainAdapterMockFuncs } from '../utils/test-data/setupZrxDeps'
import { setupQuote } from '../utils/test-data/setupSwapQuote'

describe('getSendMaxAmount', () => {
  const { web3Instance, adapterManager } = setupZrxDeps()
  const { quoteInput: quote } = setupQuote()
  const deps = { web3Instance, adapterManager }
  const wallet = ({
    ethGetAddress: jest.fn(() => Promise.resolve('0xc770eefad204b5180df6a14ee197d99d808ee52d')),
    ethSignTx: jest.fn(() => Promise.resolve({}))
  } as unknown) as HDWallet

  it('should throw an error if no asset balance is found', async () => {
    const balance = '1000'
    const args = {
      quote: { ...quote, sellAsset: { ...quote.sellAsset, tokenId: 'notFound' } },
      wallet,
      sellAssetAccountId: quote.sellAssetAccountId,
      feeEstimateKey: chainAdapters.FeeDataKey.Average
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

  it('should throw an error if no asset balance is found', async () => {
    const balance = '1000'
    const feePerTx = '100'
    const args = {
      quote: { ...quote, sellAsset: { ...quote.sellAsset, tokenId: 'notFound' } },
      wallet,
      sellAssetAccountId: quote.sellAssetAccountId,
      feeEstimateKey: chainAdapters.FeeDataKey.Average
    }
    ;(adapterManager.byChain as jest.Mock<unknown>).mockReturnValue({
      ...chainAdapterMockFuncs,
      getAccount: jest.fn(() =>
        Promise.resolve({
          chainSpecific: { tokens: [{ contract: 'contractAddress', balance }] }
        })
      ),
      getFeeData: jest.fn(() =>
        Promise.resolve({
          [chainAdapters.FeeDataKey.Average]: { chainSpecific: { feePerTx } }
        })
      )
    })

    await expect(getSendMaxAmount(deps, args)).rejects.toThrow(
      `No balance found for ${quote.sellAsset.symbol}`
    )
  })

  it('should throw an error if ETH balance is less than the estimated fee', async () => {
    const balance = '100'
    const feePerTx = '1000'
    const args = {
      quote: { ...quote, sellAsset: { ...quote.sellAsset, tokenId: 'contractAddress' } },
      wallet,
      sellAssetAccountId: quote.sellAssetAccountId,
      feeEstimateKey: chainAdapters.FeeDataKey.Average
    }
    ;(adapterManager.byChain as jest.Mock<unknown>).mockReturnValue({
      ...chainAdapterMockFuncs,
      getAccount: jest.fn(() =>
        Promise.resolve({
          chainSpecific: { tokens: [{ contract: 'contractAddress', balance }] }
        })
      ),
      getFeeData: jest.fn(() =>
        Promise.resolve({
          [chainAdapters.FeeDataKey.Average]: { chainSpecific: { feePerTx } }
        })
      )
    })

    await expect(getSendMaxAmount(deps, args)).rejects.toThrow(
      'ETH balance is less than estimated fee'
    )
  })

})
