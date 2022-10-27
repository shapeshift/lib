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
  const ethInboundAddresses = inboundAddresses.find((inbound) => inbound.chain === 'chain')

  if (!ethInboundAddresses)
    throw new SwapError(`[getEthInboundAddresses]: no inbound addresses found for ${chain}`, {
      code: SwapErrorTypes.RESPONSE_ERROR,
      details: { inboundAddresses },
    })

  return ethInboundAddresses
}
