import { SwapError, SwapErrorTypes } from '../../../api'
import { InboundResponse } from '../types'
import { thorService } from '../utils/thorService'

export const getInboundAddressesForChain = async (
  daemonUrl: string,
  chain: string,
): Promise<InboundResponse> => {
  const { data: inboundAddresses } = await thorService.get<InboundResponse[]>(
    `${daemonUrl}/lcd/thorchain/inbound_addresses`,
  )
  const inboundAddressesForChain = inboundAddresses.find((inbound) => inbound.chain === chain)

  if (!inboundAddressesForChain)
    throw new SwapError(`[getInboundAddressesForChain]: no inbound addresses found for ${chain}`, {
      code: SwapErrorTypes.RESPONSE_ERROR,
      details: { inboundAddresses },
    })

  return inboundAddressesForChain
}
