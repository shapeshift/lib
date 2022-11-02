import { adapters, AssetId } from '@shapeshiftoss/caip'

import type { InboundAddressResponse } from '../types'
import { thorService } from './thorService'

export const getInboundAddressDataForChain = async (
  daemonUrl: string,
  assetId: AssetId | undefined,
): Promise<InboundAddressResponse | undefined> => {
  if (!assetId) return undefined
  const assetPoolId = adapters.assetIdToPoolAssetId({ assetId })
  const assetChainSymbol = assetPoolId?.slice(0, assetPoolId.indexOf('.'))
  const { data: inboundAddresses } = await thorService.get<InboundAddressResponse[]>(
    `${daemonUrl}/lcd/thorchain/inbound_addresses`,
  )
  return inboundAddresses.find((inbound) => inbound.chain === assetChainSymbol)
}
