import { AssetReference } from '@shapeshiftoss/caip'
import { ChainAdapterManager, ethereum, FeeDataKey } from '@shapeshiftoss/chain-adapters'
import { KnownChainIds } from '@shapeshiftoss/types'

import { QuoteFeeData, SwapError, SwapErrorTypes } from '../../../../../api'
import { bn, bnOrZero } from '../../../../utils/bignumber'
import { APPROVAL_GAS_LIMIT } from '../../../../utils/constants'

export const getEthTxFees = async ({
  adapterManager,
  sellAssetReference,
  tradeFee
}: {
  adapterManager: ChainAdapterManager
  sellAssetReference: AssetReference | string
  tradeFee: string
}): Promise<QuoteFeeData<KnownChainIds.EthereumMainnet>> => {
  try {
    const adapter = adapterManager.get(KnownChainIds.EthereumMainnet) as
      | ethereum.ChainAdapter
      | undefined
    if (!adapter) {
      throw new SwapError(
        `[getThorTxInfo] - No chain adapter found for ${KnownChainIds.EthereumMainnet}.`,
        {
          code: SwapErrorTypes.UNSUPPORTED_CHAIN,
          details: { chainId: KnownChainIds.EthereumMainnet }
        }
      )
    }

    const gasFeeData = await adapter.getGasFeeData()
    const gasLimit = '100000' // good value to cover all thortrades out of eth/erc20

    const feeDataOptions = {
      fast: {
        txFee: bn(gasLimit).times(gasFeeData[FeeDataKey.Fast].gasPrice).toString(),
        chainSpecific: {
          gasPrice: gasFeeData[FeeDataKey.Fast].gasPrice,
          gasLimit
        }
      }
    }

    const feeData = feeDataOptions['fast']

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
  } catch (e) {
    if (e instanceof SwapError) throw e
    throw new SwapError('[getThorTxInfo]', { cause: e, code: SwapErrorTypes.TRADE_QUOTE_FAILED })
  }
}
