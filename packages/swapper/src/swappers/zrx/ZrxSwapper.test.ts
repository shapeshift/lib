import { HDWallet } from '@shapeshiftoss/hdwallet-core'
import { ZrxSwapper } from './ZrxSwapper'
import Web3 from 'web3'
import { ChainAdapterManager } from '@shapeshiftoss/chain-adapters'
import { buildQuoteTx } from '../zrx/buildQuoteTx/buildQuoteTx'
import { GetQuoteInput } from '../../api'

jest.mock('../zrx/buildQuoteTx/buildQuoteTx', () => ({
  buildQuoteTx: jest.fn()
}))

describe('ZrxSwapper', () => {
  describe('buildQuoteTx', () => {
    const input = {} as unknown as GetQuoteInput
    const wallet = {} as unknown as HDWallet
    const web3 = {} as unknown as Web3
    const adapterManager = {} as unknown as ChainAdapterManager
    const deps = { web3, adapterManager }

    it('calls buildQuoteTx on swapper.buildQuoteTx', async () => {
      const swapper = new ZrxSwapper(deps)
      const args = { input, wallet }

      await swapper.buildQuoteTx(args)
      expect(buildQuoteTx).toHaveBeenCalled()
    })
  })
})
