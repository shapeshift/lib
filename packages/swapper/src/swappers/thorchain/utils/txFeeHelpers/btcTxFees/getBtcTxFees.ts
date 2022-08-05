import { ChainId } from '@shapeshiftoss/caip'
import { ChainAdapter } from '@shapeshiftoss/chain-adapters'
import { KnownChainIds } from '@shapeshiftoss/types'

import { QuoteFeeData, SwapError, SwapErrorTypes } from '../../../../../api'
import { bn } from '../../../../utils/bignumber'
import { ThorChainUtxoChainIds } from '../../../types'

export const getBtcTxFees = async ({
  opReturnData,
  vault,
  sellAmount,
  sellAdapter,
  pubkey,
  tradeFee
}: {
  opReturnData: string
  vault: string
  sellAmount: string
  sellAdapter: ChainAdapter<ChainId>
  pubkey: string
  tradeFee: string
}): Promise<QuoteFeeData<KnownChainIds.BitcoinMainnet>> => {
  try {
    const feeDataOptions = await (sellAdapter as ChainAdapter<ThorChainUtxoChainIds>).getFeeData({
      to: vault,
      value: sellAmount,
      chainSpecific: { pubkey, opReturnData }
    })

    const feeData = feeDataOptions['fast']

    return {
      fee: feeData.txFee,
      tradeFee,
      chainSpecific: {
        satsPerByte: feeData.chainSpecific.satoshiPerByte,
        byteCount: bn(feeData.txFee)
          .dividedBy(feeData.chainSpecific.satoshiPerByte)
          .dp(0)
          .toString()
      }
    }
  } catch (e) {
    if (e instanceof SwapError) throw e
    throw new SwapError('[getBtcTxFeess]', { cause: e, code: SwapErrorTypes.TRADE_QUOTE_FAILED })
  }
}
