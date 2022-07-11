import { ethereum } from '@shapeshiftoss/chain-adapters'
import { HDWallet } from '@shapeshiftoss/hdwallet-core'
import Web3 from 'web3'

import { SwapperType } from '../../api'
import { BTC, ETH, FOX, WBTC, WETH } from '../utils/test-data/assets'
import { setupQuote } from '../utils/test-data/setupSwapQuote'
import { cowApprovalNeeded } from './cowApprovalNeeded/cowApprovalNeeded'
import { cowApproveInfinite } from './cowApproveInfinite/cowApproveInfinite'
import { CowSwapper, CowSwapperDeps } from './CowSwapper'
import { getCowSwapTradeQuote } from './getCowSwapTradeQuote/getCowSwapTradeQuote'
import { getUsdRate } from './utils/helpers/helpers'

jest.mock('./utils/helpers/helpers')

jest.mock('./cowApprovalNeeded/cowApprovalNeeded', () => ({
  cowApprovalNeeded: jest.fn()
}))

jest.mock('./cowApproveInfinite/cowApproveInfinite', () => ({
  cowApproveInfinite: jest.fn()
}))

const COW_SWAPPER_DEPS: CowSwapperDeps = {
  apiUrl: 'https://api.cow.fi/mainnet/api/',
  adapter: <ethereum.ChainAdapter>{},
  web3: <Web3>{},
  feeAsset: WETH
}

jest.mock('./getCowSwapTradeQuote/getCowSwapTradeQuote', () => ({
  getCowSwapTradeQuote: jest.fn()
}))

const ASSET_IDS = [ETH.assetId, WBTC.assetId, WETH.assetId, BTC.assetId, FOX.assetId]

describe('CowSwapper', () => {
  const wallet = <HDWallet>{}
  const swapper = new CowSwapper(COW_SWAPPER_DEPS)

  describe('static properties', () => {
    it('returns the correct swapper name', () => {
      expect(CowSwapper.swapperName).toEqual('CowSwapper')
    })
  })

  describe('getType', () => {
    it('returns the correct type for CowSwapper', async () => {
      await expect(swapper.getType()).toEqual(SwapperType.CowSwap)
    })
  })

  describe('getUsdRate', () => {
    it('calls getUsdRate on swapper.getUsdRate', async () => {
      await swapper.getUsdRate(FOX)
      expect(getUsdRate).toHaveBeenCalledWith(COW_SWAPPER_DEPS, FOX)
    })
  })

  describe('filterAssetIdsBySellable', () => {
    it('returns empty array when called with an empty array', () => {
      expect(swapper.filterAssetIdsBySellable([])).toEqual([])
    })

    it('returns array filtered out of non erc20 tokens', () => {
      expect(swapper.filterAssetIdsBySellable(ASSET_IDS)).toEqual([
        WBTC.assetId,
        WETH.assetId,
        FOX.assetId
      ])
    })

    it('returns array filtered out of unsupported tokens', () => {
      const assetIds = [FOX.assetId, 'eip155:1/erc20:0xdc49108ce5c57bc3408c3a5e95f3d864ec386ed3']
      expect(swapper.filterAssetIdsBySellable(assetIds)).toEqual([FOX.assetId])
    })
  })

  describe('filterBuyAssetsBySellAssetId', () => {
    it('returns empty array when called with an empty assetIds array', () => {
      expect(
        swapper.filterBuyAssetsBySellAssetId({ assetIds: [], sellAssetId: WETH.assetId })
      ).toEqual([])
    })

    it('returns empty array when called with sellAssetId that is not sellable', () => {
      expect(
        swapper.filterBuyAssetsBySellAssetId({
          assetIds: ASSET_IDS,
          sellAssetId: ETH.assetId
        })
      ).toEqual([])
      expect(
        swapper.filterBuyAssetsBySellAssetId({
          assetIds: ASSET_IDS,
          sellAssetId: 'eip155:1/erc20:0xdc49108ce5c57bc3408c3a5e95f3d864ec386ed3'
        })
      ).toEqual([])
    })

    it('returns array filtered out of non erc20 tokens when called with a sellable sellAssetId', () => {
      expect(
        swapper.filterBuyAssetsBySellAssetId({
          assetIds: ASSET_IDS,
          sellAssetId: WETH.assetId
        })
      ).toEqual([WBTC.assetId, FOX.assetId])
      expect(
        swapper.filterBuyAssetsBySellAssetId({
          assetIds: ASSET_IDS,
          sellAssetId: WBTC.assetId
        })
      ).toEqual([WETH.assetId, FOX.assetId])
      expect(
        swapper.filterBuyAssetsBySellAssetId({
          assetIds: ASSET_IDS,
          sellAssetId: FOX.assetId
        })
      ).toEqual([WBTC.assetId, WETH.assetId])
    })

    it('returns array filtered out of unsupported tokens when called with a sellable sellAssetId', () => {
      const assetIds = [FOX.assetId, 'eip155:1/erc20:0xdc49108ce5c57bc3408c3a5e95f3d864ec386ed3']
      expect(
        swapper.filterBuyAssetsBySellAssetId({
          assetIds,
          sellAssetId: WETH.assetId
        })
      ).toEqual([FOX.assetId])
      expect(swapper.filterBuyAssetsBySellAssetId({ assetIds, sellAssetId: FOX.assetId })).toEqual(
        []
      )
    })
  })

  describe('getTradeQuote', () => {
    it('calls getCowSwapTradeQuote on swapper.getTradeQuote', async () => {
      const { quoteInput } = setupQuote()
      await swapper.getTradeQuote(quoteInput)
      expect(getCowSwapTradeQuote).toHaveBeenCalledTimes(1)
      expect(getCowSwapTradeQuote).toHaveBeenCalledWith(COW_SWAPPER_DEPS, quoteInput)
    })
  })

  describe('cowApprovalNeeded', () => {
    it('calls cowApprovalNeeded on swapper.approvalNeeded', async () => {
      const { tradeQuote } = setupQuote()
      const args = { quote: tradeQuote, wallet }
      await swapper.approvalNeeded(args)
      expect(cowApprovalNeeded).toHaveBeenCalledTimes(1)
      expect(cowApprovalNeeded).toHaveBeenCalledWith(COW_SWAPPER_DEPS, args)
    })
  })

  describe('cowApproveInfinite', () => {
    it('calls cowApproveInfinite on swapper.approveInfinite', async () => {
      const { tradeQuote } = setupQuote()
      const args = { quote: tradeQuote, wallet }
      await swapper.approveInfinite(args)
      expect(cowApproveInfinite).toHaveBeenCalledTimes(1)
      expect(cowApproveInfinite).toHaveBeenCalledWith(COW_SWAPPER_DEPS, args)
    })
  })
})
