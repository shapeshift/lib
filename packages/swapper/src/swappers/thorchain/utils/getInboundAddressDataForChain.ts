import { SwapError, SwapErrorTypes } from '../../../api'
import { InboundAddressResponse } from '../types'
import { thorService } from './thorService'

export const getInboundAddressDataForChain = async (
  daemonUrl: string,
  chain: string | undefined,
): Promise<InboundAddressResponse | undefined> => {
  const { data: inboundAddress } = await thorService.get<InboundAddressResponse[]>(
    `${daemonUrl}/lcd/thorchain/inbound_addresses`,
  )
  const inboundAddressForChain = inboundAddress.find((inbound) => inbound.chain === chain)

  if (!inboundAddressForChain)
    throw new SwapError(`[getInboundAddressForChain]: no inbound addresses found for ${chain}`, {
      code: SwapErrorTypes.RESPONSE_ERROR,
      details: { inboundAddress },
    })

  return inboundAddressForChain
}
