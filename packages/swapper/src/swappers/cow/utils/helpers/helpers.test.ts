import { AssetService } from '@shapeshiftoss/asset-service'
import { ChainTypes, NetworkTypes } from '@shapeshiftoss/types'

import { FOX, WBTC } from '../../../utils/test-data/assets'
import { CowSwapperDeps } from '../../CowSwapper'
import { cowService } from '../cowService'
import { getUsdRate } from '../helpers/helpers'

const axios = jest.createMockFromModule('axios')

//@ts-ignore
axios.create = jest.fn(() => axios)
jest.mock('../cowService')
jest.mock('@shapeshiftoss/asset-service')

declare type ByTokenIdArgs = {
  chain: ChainTypes
  network?: NetworkTypes
  tokenId?: string
}

// @ts-ignore
AssetService.mockImplementation(() => ({
  byTokenId: (args: ByTokenIdArgs) => {
    if (args.tokenId === '0xc770eefad204b5180df6a14ee197d99d808ee52d') {
      return FOX
    }
    return WBTC
  }
}))

describe('utils', () => {
  const cowSwapperDeps: CowSwapperDeps = {
    assetService: new AssetService('')
  }

  describe('getUsdRate', () => {
    it('gets the usd rate of FOX', async () => {
      ;(cowService.get as jest.Mock<unknown>).mockReturnValue(
        Promise.resolve({
          data: {
            amount: '7702130994619175777719',
            token: '0xc770eefad204b5180df6a14ee197d99d808ee52d'
          }
        })
      )
      const rate = await getUsdRate(cowSwapperDeps, {
        symbol: 'FOX',
        assetId: 'eip155:1/erc20:0xc770eefad204b5180df6a14ee197d99d808ee52d'
      })
      expect(parseFloat(rate)).toBeCloseTo(0.129834198, 9)
      expect(cowService.get).toHaveBeenCalledWith(
        '/v1/markets/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48-0xc770eefad204b5180df6a14ee197d99d808ee52d/buy/1000000000'
      )
    })

    it('gets the usd rate of WBTC', async () => {
      ;(cowService.get as jest.Mock<unknown>).mockReturnValue(
        Promise.resolve({
          data: {
            amount: '3334763',
            token: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599'
          }
        })
      )
      const rate = await getUsdRate(cowSwapperDeps, {
        symbol: 'WBTC',
        assetId: 'eip155:1/erc20:0x2260fac5e5542a773aa44fbcfedf7c193bc2c599'
      })
      expect(parseFloat(rate)).toBeCloseTo(29987.13851629, 9)
      expect(cowService.get).toHaveBeenCalledWith(
        '/v1/markets/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48-0x2260fac5e5542a773aa44fbcfedf7c193bc2c599/buy/1000000000'
      )
    })

    it('should fail when called with non-erc20 asset', async () => {
      await expect(
        getUsdRate(cowSwapperDeps, {
          symbol: 'ETH',
          assetId: 'eip155:1/slip44:60'
        })
      ).rejects.toThrow('[getUsdRate] - unsupported asset namespace')
    })

    it('should fail when api is returning 0 as token amount', async () => {
      ;(cowService.get as jest.Mock<unknown>).mockReturnValue(
        Promise.resolve({
          data: {
            amount: '0',
            token: '0xc770eefad204b5180df6a14ee197d99d808ee52d'
          }
        })
      )
      await expect(
        getUsdRate(cowSwapperDeps, {
          symbol: 'FOX',
          assetId: 'eip155:1/erc20:0xc770eefad204b5180df6a14ee197d99d808ee52d'
        })
      ).rejects.toThrow('[getUsdRate] - Failed to get token amount')
    })

    it('should fail when axios is throwing an error', async () => {
      ;(cowService.get as jest.Mock<unknown>).mockImplementation(() => {
        throw new Error('unexpected error')
      })
      await expect(
        getUsdRate(cowSwapperDeps, {
          symbol: 'FOX',
          assetId: 'eip155:1/erc20:0xc770eefad204b5180df6a14ee197d99d808ee52d'
        })
      ).rejects.toThrow('[getUsdRate]')
    })
  })
})
