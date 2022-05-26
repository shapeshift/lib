import { poolAssetIdToAssetId } from './index'
import { ethAssetId, btcAssetId } from '../../constants'

describe('thortrading', () => {
  describe('poolAssetIdToAssetId', () => {
    it('returns Ethereum assetId when poolAssetId is ETH.ETH', () => {
      const result = poolAssetIdToAssetId('ETH.ETH')
      expect(result).toEqual(ethAssetId)
    })

    it('returns Bitcoin assetId when poolAssetId is BTC.BTC', () => {
      const result = poolAssetIdToAssetId('BTC.BTC')
      expect(result).toEqual(btcAssetId)
    })

    it('returns ERC20 assetId when poolAssetId is in ERC20 format', () => {
      const usdcAssetId = 'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
      const result = poolAssetIdToAssetId('ETH.USDC-0XA0B86991C6218B36C1D19D4A2E9EB0CE3606EB48')
      expect(result).toEqual(usdcAssetId)
    })
  })
})
