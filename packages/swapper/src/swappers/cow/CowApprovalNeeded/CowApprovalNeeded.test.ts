import { HDWallet } from '@shapeshiftoss/hdwallet-core'
import Web3 from 'web3'

import { BTC, ETH } from '../../utils/test-data/assets'
import { setupDeps } from '../../utils/test-data/setupDeps'
import { setupQuote } from '../utils/test-data/setupSwapQuote'
import { CowApprovalNeeded } from './CowApprovalNeeded'

jest.mock('web3')

// @ts-ignore
Web3.mockImplementation(() => ({
  eth: {
    Contract: jest.fn(() => ({
      methods: {
        allowance: jest.fn(() => ({
          call: jest.fn()
        }))
      }
    }))
  }
}))

describe('CowApprovalNeeded', () => {
  const { web3Instance: web3, adapterManager } = setupDeps()
  const args = { web3, adapterManager, apiUrl: '' }
  const walletAddress = '0xc770eefad204b5180df6a14ee197d99d808ee52d'
  const wallet = {
    ethGetAddress: jest.fn(() => Promise.resolve(walletAddress))
  } as unknown as HDWallet

  const { tradeQuote } = setupQuote()

  it('returns false if sellAsset assetId is ETH / non ERC-20', async () => {
    const input1 = {
      quote: { ...tradeQuote, sellAsset: ETH },
      wallet
    }

    const input2 = {
      quote: { ...tradeQuote, sellAsset: BTC },
      wallet
    }

    await expect(CowApprovalNeeded(args, input1)).rejects.toThrow(
      '[CowApprovalNeeded] - unsupported asset namespace'
    )
    await expect(CowApprovalNeeded(args, input2)).rejects.toThrow(
      '[CowApprovalNeeded] - unsupported asset namespace'
    )
  })

  it('returns false if allowanceOnChain is greater than quote.sellAmount', async () => {
    const allowanceOnChain = '50'
    const input = {
      quote: {
        ...tradeQuote,
        sellAmount: '10'
      },
      wallet
    }
    const mockedAllowance = jest.fn(() => ({
      call: jest.fn(() => allowanceOnChain)
    }))
    ;(web3.eth.Contract as jest.Mock<unknown>).mockImplementation(() => ({
      methods: {
        allowance: mockedAllowance
      }
    }))

    expect(await CowApprovalNeeded(args, input)).toEqual({
      approvalNeeded: false
    })
    expect(mockedAllowance).toHaveBeenCalledTimes(1)
    expect(mockedAllowance).toHaveBeenCalledWith(
      'address',
      '0xc92e8bdf79f0507f65a392b0ab4667716bfe0110'
    )
  })

  it('returns true if allowanceOnChain is less than quote.sellAmount', async () => {
    const allowanceOnChain = '5'
    const input = {
      quote: {
        ...tradeQuote,
        sellAmount: '10'
      },
      wallet
    }

    const mockedAllowance = jest.fn(() => ({
      call: jest.fn(() => allowanceOnChain)
    }))
    ;(web3.eth.Contract as jest.Mock<unknown>).mockImplementation(() => ({
      methods: {
        allowance: mockedAllowance
      }
    }))

    expect(await CowApprovalNeeded(args, input)).toEqual({
      approvalNeeded: true
    })
    expect(mockedAllowance).toHaveBeenCalledTimes(1)
    expect(mockedAllowance).toHaveBeenCalledWith(
      'address',
      '0xc92e8bdf79f0507f65a392b0ab4667716bfe0110'
    )
  })
})
