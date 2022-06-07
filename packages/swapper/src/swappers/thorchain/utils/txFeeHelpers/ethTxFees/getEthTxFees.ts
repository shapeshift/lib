import { ChainTypes, Asset } from '@shapeshiftoss/types'
import { ChainAdapter } from '@shapeshiftoss/chain-adapters'
import { AssetReference } from '@shapeshiftoss/caip'
import { QuoteFeeData } from '../../../../../api'

export const getEthTxFees = async ({
  data,
  router,
  sellAmount,
  adapter,
  receiveAddress
}: {
  data: string
  router: string
  buyAsset: Asset
  sellAmount: string
  sellAssetReference: AssetReference | string
  adapter: ChainAdapter<ChainTypes.Ethereum>
  receiveAddress: string
}): Promise<QuoteFeeData<'eip155:1'>> => {

  const feeData = await adapter.getFeeData({
    to: router,
    value: sellAmount,
    chainSpecific: { from: receiveAddress, contractData: data }
  })

  const tradeFee = getTradeFee()
  return {
    ...feeData,
    tradeFee
  }
}
