import { btcAssetId, ethAssetId } from '@shapeshiftoss/caip'
import axios from 'axios'

import { ThorchainSwapper } from './ThorchainSwapper'
import { midgardResponse } from './utils/test-data/midgardResponse'
jest.mock('axios')

const mockedAxios = axios as jest.Mocked<typeof axios>

describe('ThorchainSwapper', () => {
  const foxAssetId = 'eip155:1/erc20:0xc770eefad204b5180df6a14ee197d99d808ee52d'

  it('fetches supported assetIds on initialize', async () => {
    const swapper = new ThorchainSwapper({
      midgardUrl: 'localhost:3000'
    })

    mockedAxios.get.mockResolvedValue({ data: midgardResponse })

    await swapper.initialize()

    expect(swapper.supportedAssetIds).toEqual([btcAssetId, ethAssetId, foxAssetId])
  })

  it('throws when api response', async () => {
    const swapper = new ThorchainSwapper({
      midgardUrl: 'localhost:3000'
    })

    mockedAxios.get.mockImplementation(() => {
      throw new Error('midgard failed')
    })

    await expect(swapper.initialize()).rejects.toThrow(
      '[thorchainInitialize]: initialize failed to set supportedAssetIds'
    )
  })
})
