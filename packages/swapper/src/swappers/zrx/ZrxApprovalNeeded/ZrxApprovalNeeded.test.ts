import { HDWallet } from '@shapeshiftoss/hdwallet-core'
import Web3 from 'web3'

import { setupDeps } from '../../utils/test-data/setupDeps'
import { setupQuote } from '../../utils/test-data/setupSwapQuote'
import { zrxService } from '../utils/zrxService'
import { ZrxApprovalNeeded } from './ZrxApprovalNeeded'

jest.mock('web3')
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn()
  }))
}))

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

describe('ZrxApprovalNeeded', () => {
  const { web3Instance: web3, adapterManager } = setupDeps()
  const args = { web3, adapterManager }
  const walletAddress = '0xc770eefad204b5180df6a14ee197d99d808ee52d'
  const wallet = {
    ethGetAddress: jest.fn(() => Promise.resolve(walletAddress))
  } as unknown as HDWallet

  const { tradeQuote, sellAsset } = setupQuote()

  it('returns false if sellAsset assetId is ETH', async () => {
    const input = {
      quote: { ...tradeQuote, sellAsset: { ...sellAsset, assetId: 'eip155:1/slip44:60' } },
      wallet
    }

    expect(await ZrxApprovalNeeded(args, input)).toEqual({ approvalNeeded: false })
  })

  it('throws an error if sellAsset chain is not ETH', async () => {
    const input = {
      quote: { ...tradeQuote, sellAsset: { ...sellAsset, chainId: '' } },
      wallet
    }

    await expect(ZrxApprovalNeeded(args, input)).rejects.toThrow('[ZrxApprovalNeeded]')
  })

  it('returns false if allowanceOnChain is greater than quote.sellAmount', async () => {
    const allowanceOnChain = '50'
    const data = { allowanceTarget: '10' }
    const input = {
      quote: {
        ...tradeQuote,
        sellAmount: '10',
        feeData: { fee: '0', chainSpecific: { gasPrice: '1000' }, tradeFee: '0' }
      },
      wallet
    }
    ;(web3.eth.Contract as jest.Mock<unknown>).mockImplementation(() => ({
      methods: {
        allowance: jest.fn(() => ({
          call: jest.fn(() => allowanceOnChain)
        }))
      }
    }))
    ;(zrxService.get as jest.Mock<unknown>).mockReturnValue(Promise.resolve({ data }))

    expect(await ZrxApprovalNeeded(args, input)).toEqual({
      approvalNeeded: false
    })
  })

  it('returns true if allowanceOnChain is less than quote.sellAmount', async () => {
    const allowanceOnChain = '5'
    const data = { allowanceTarget: '10' }
    const input = {
      quote: {
        ...tradeQuote,
        sellAmount: '10',
        feeData: { fee: '0', chainSpecific: { gasPrice: '1000' }, tradeFee: '0' }
      },
      wallet
    }
    ;(web3.eth.Contract as jest.Mock<unknown>).mockImplementation(() => ({
      methods: {
        allowance: jest.fn(() => ({
          call: jest.fn(() => allowanceOnChain)
        }))
      }
    }))
    ;(zrxService.get as jest.Mock<unknown>).mockReturnValue(Promise.resolve({ data }))

    expect(await ZrxApprovalNeeded(args, input)).toEqual({
      approvalNeeded: true
    })
  })
})
