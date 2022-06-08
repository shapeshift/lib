import { AssetReference } from '@shapeshiftoss/caip'
import { ChainAdapterManager } from '@shapeshiftoss/chain-adapters'
import { Asset, chainAdapters, ChainTypes } from '@shapeshiftoss/types'

import { QuoteFeeData } from '../../../../../api'
import { bnOrZero } from '../../../../utils/bignumber'
import { APPROVAL_GAS_LIMIT } from '../../../../utils/constants'
import { ThorchainSwapperDeps } from '../../../types'
import { estimateTradeFee } from '../../estimateTradeFee/estimateTradeFee'

export const getEthTxFees = async ({
  deps,
  data,
  router,
  buyAsset,
  sellAmount,
  adapterManager,
  receiveAddress,
  sellAssetReference
}: {
  deps: ThorchainSwapperDeps
  data: string
  router: string
  buyAsset: Asset
  sellAmount: string
  sellAssetReference: AssetReference | string
  adapterManager: ChainAdapterManager
  receiveAddress: string
}): Promise<QuoteFeeData<'eip155:1'>> => {
  const adapter = adapterManager.byChainId('eip155:1')
  const feeDataOptions = await adapter.getFeeData({
    to: router,
    value: sellAmount,
    chainSpecific: { from: receiveAddress, contractData: data }
  })

  const feeData = feeDataOptions['fast'] as chainAdapters.FeeData<ChainTypes.Ethereum>
  const tradeFee = await estimateTradeFee(deps, buyAsset.assetId)

  return {
    fee: feeData.txFee,
    chainSpecific: {
      estimatedGas: feeData.chainSpecific.gasLimit,
      gasPrice: feeData.chainSpecific.gasPrice,
      approvalFee:
        sellAssetReference &&
        bnOrZero(APPROVAL_GAS_LIMIT)
          .multipliedBy(bnOrZero(feeData.chainSpecific.gasPrice))
          .toString()
    },
    tradeFee
  }
}
