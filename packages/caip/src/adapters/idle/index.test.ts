import toLower from 'lodash/toLower'

import { toAssetId } from '../../assetId/assetId'
import { CHAIN_NAMESPACE, CHAIN_REFERENCE } from '../../constants'
import { assetIdToIdle, idleToAssetId } from '.'

describe('adapters:idle', () => {
  describe('idleToAssetId', () => {
    it('can get AssetId id for Idle DAI Senior Tranche', () => {
      const chainNamespace = CHAIN_NAMESPACE.Ethereum
      const chainReference = CHAIN_REFERENCE.EthereumMainnet
      const assetNamespace = 'erc20'
      const checksumAddress = '0xE9ada97bDB86d827ecbaACCa63eBcD8201D8b12E'
      const assetId = toAssetId({
        chainNamespace,
        chainReference,
        assetNamespace,
        assetReference: toLower(checksumAddress)
      })
      expect(idleToAssetId(checksumAddress)).toEqual(assetId)
    })
  })
  describe('AssetIdToIdle', () => {
    it('can get coincap id for Convex FRAX3CRV Senior Tranche', () => {
      const chainNamespace = CHAIN_NAMESPACE.Ethereum
      const chainReference = CHAIN_REFERENCE.EthereumMainnet
      const assetNamespace = 'erc20'
      const checksumAddress = '0x15794DA4DCF34E674C18BbFAF4a67FF6189690F5'
      const assetId = toAssetId({
        chainNamespace,
        chainReference,
        assetNamespace,
        assetReference: toLower(checksumAddress)
      })
      expect(assetIdToIdle(assetId)).toEqual(checksumAddress)
    })
  })
})
