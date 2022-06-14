import { ChainAdapterManager } from '@shapeshiftoss/chain-adapters'
import axios from 'axios'
import Web3 from 'web3'

import { ThorchainSwapper } from './ThorchainSwapper'
import { thorService } from './utils/thorService'

jest.mock('./utils/thorService')

const mockedAxios = thorService as jest.Mocked<typeof axios>

describe('ThorchainSwapper', () => {
  describe('initialize', () => {
    it('throws when api response', async () => {
      const swapper = new ThorchainSwapper({
        midgardUrl: 'localhost:3000',
        adapterManager: <ChainAdapterManager>{},
        web3: <Web3>{}
      })

      mockedAxios.get.mockImplementation(() => {
        throw new Error('midgard failed')
      })

      await expect(swapper.initialize()).rejects.toThrow(
        '[thorchainInitialize]: initialize failed to set supportedAssetIds'
      )
    })
  })
})
