import { SwapError, SwapErrorTypes } from '../../../api'
import type { InboundAddressResponse } from '../types'
import { thorService } from './thorService'

export const getInboundAddressDataForChain = async (
  daemonUrl: string,
  chain: string | undefined,
): Promise<InboundAddressResponse | undefined> => {
  const { data: inboundAddresses } = await thorService.get<InboundAddressResponse[]>(
    `${daemonUrl}/lcd/thorchain/inbound_addresses`,
  )
  const inboundAddressDataForChain = inboundAddresses.find((inbound) => inbound.chain === chain)

  if (!inboundAddressDataForChain)
    throw new SwapError(`[getInboundAddressForChain]: no inbound addresses found for ${chain}`, {
      code: SwapErrorTypes.RESPONSE_ERROR,
      details: { inboundAddress: inboundAddresses },
    })

  return inboundAddressDataForChain
}
