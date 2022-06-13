import { ChainAdapter } from '@shapeshiftoss/chain-adapters'

import { ThorchainSwapperDeps } from '../../types'

export const setupThorswapDeps = (): ThorchainSwapperDeps => {
  const feeData = {
    fast: {
      txFee: '1',
      chainSpecific: { approvalFee: '1', gasLimit: '1', gasPrice: '1' },
      tradeFee: '2'
    }
  }

  const adapterManager = new Map([
    [
      'eip155:1',
      {
        buildBIP44Params: jest.fn(() => ({ purpose: 44, coinType: 60, accountNumber: 0 })),
        getAddress: jest.fn(() => Promise.resolve('0xthisIsMyAddress')),
        getFeeData: jest.fn(() => feeData)
      } as unknown as ChainAdapter<'eip155'>
    ]
  ])

  const midgardUrl = 'localhost:3000'

  return { adapterManager, midgardUrl }
}
