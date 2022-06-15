import { fromAssetId } from '@shapeshiftoss/caip'
import { ethereum } from '@shapeshiftoss/chain-adapters'
import { ETHSignTx, HDWallet } from '@shapeshiftoss/hdwallet-core'
import { Asset, BIP44Params } from '@shapeshiftoss/types'
import { numberToHex } from 'web3-utils'

import { SwapError, SwapErrorTypes } from '../../../../api'
import { ThorchainSwapperDeps } from '../../types'
import { getThorTxInfo } from '../ethereum/utils/getThorTxData'

export const makeTradeTx = async ({
  wallet,
  bip44Params,
  sellAmount,
  buyAsset,
  sellAsset,
  destinationAddress,
  adapter,
  maxFeePerGas,
  maxPriorityFeePerGas,
  gasPrice,
  slippageTolerance,
  deps,
  gasLimit
}: {
  wallet: HDWallet
  bip44Params: BIP44Params
  sellAmount: string
  buyAsset: Asset
  sellAsset: Asset
  destinationAddress: string
  adapter: ethereum.ChainAdapter
  slippageTolerance: string
  deps: ThorchainSwapperDeps
  gasLimit: string
} & (
  | {
      gasPrice: string
      maxFeePerGas?: never
      maxPriorityFeePerGas?: never
    }
  | {
      gasPrice?: never
      maxFeePerGas: string
      maxPriorityFeePerGas: string
    }
)): Promise<{
  txToSign: ETHSignTx
}> => {
  try {
    const { assetNamespace } = fromAssetId(sellAsset.assetId)

    const isErc20Trade = assetNamespace === 'erc20'

    const { data, router } = await getThorTxInfo({
      deps,
      sellAsset,
      buyAsset,
      sellAmount,
      slippageTolerance,
      destinationAddress,
      isErc20Trade
    })

    return adapter.buildCustomTx({
      wallet,
      bip44Params,
      to: router,
      gasLimit,
      ...(gasPrice !== undefined
        ? {
            gasPrice: numberToHex(gasPrice)
          }
        : {
            // (The type system guarantees that on this branch both of these will be set)
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            maxFeePerGas: numberToHex(maxFeePerGas!),
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            maxPriorityFeePerGas: numberToHex(maxPriorityFeePerGas!)
          }),
      value: isErc20Trade ? '0' : sellAmount,
      data
    })
  } catch (e) {
    if (e instanceof SwapError) throw e
    throw new SwapError('[makeTradeTx]: error making trade tx', {
      code: SwapErrorTypes.BUILD_TRADE_FAILED,
      cause: e
    })
  }
}
