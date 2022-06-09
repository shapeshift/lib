import { ChainAdapterManager } from '@shapeshiftoss/chain-adapters'
import { HDWallet } from '@shapeshiftoss/hdwallet-core'
import Web3 from 'web3'

import { SwapperType } from '../../api'
import { FOX } from '../utils/test-data/assets'
import { setupQuote } from '../utils/test-data/setupSwapQuote'
import { CowApprovalNeeded } from './CowApprovalNeeded/CowApprovalNeeded'
import { CowApproveInfinite } from './CowApproveInfinite/CowApproveInfinite'
import { CowSwapper, CowSwapperDeps } from './CowSwapper'
import { getUsdRate } from './utils/helpers/helpers'

jest.mock('./utils/helpers/helpers')

jest.mock('./CowApprovalNeeded/CowApprovalNeeded', () => ({
  CowApprovalNeeded: jest.fn()
}))

jest.mock('./CowApproveInfinite/CowApproveInfinite', () => ({
  CowApproveInfinite: jest.fn()
}))

const cowSwapperDeps: CowSwapperDeps = {
  apiUrl: 'https://api.cow.fi/mainnet/api/',
  adapterManager: <ChainAdapterManager>{},
  web3: <Web3>{}
}

describe('CowSwapper', () => {
  const wallet = <HDWallet>{}

  describe('static properties', () => {
    it('returns the correct swapper name', async () => {
      expect(CowSwapper.swapperName).toEqual('CowSwapper')
    })
  })

  describe('getType', () => {
    it('returns the correct type for CowSwapper', async () => {
      const swapper = new CowSwapper(cowSwapperDeps)
      await expect(swapper.getType()).toEqual(SwapperType.CowSwap)
    })
  })

  describe('getUsdRate', () => {
    it('calls getUsdRate on swapper.getUsdRate', async () => {
      const swapper = new CowSwapper(cowSwapperDeps)
      await swapper.getUsdRate(FOX)
      expect(getUsdRate).toHaveBeenCalledWith(cowSwapperDeps, FOX)
    })
  })

  describe('CowApprovalNeeded', () => {
    it('calls CowApprovalNeeded on swapper.approvalNeeded', async () => {
      const swapper = new CowSwapper(cowSwapperDeps)
      const { tradeQuote } = setupQuote()
      const args = { quote: tradeQuote, wallet }
      await swapper.approvalNeeded(args)
      expect(CowApprovalNeeded).toHaveBeenCalledTimes(1)
      expect(CowApprovalNeeded).toHaveBeenCalledWith(cowSwapperDeps, args)
    })
  })

  describe('CowApproveInfinite', () => {
    it('calls CowApproveInfinite on swapper.approveInfinite', async () => {
      const swapper = new CowSwapper(cowSwapperDeps)
      const { tradeQuote } = setupQuote()
      const args = { quote: tradeQuote, wallet }
      await swapper.approveInfinite(args)
      expect(CowApproveInfinite).toHaveBeenCalledTimes(1)
      expect(CowApproveInfinite).toHaveBeenCalledWith(cowSwapperDeps, args)
    })
  })
})
