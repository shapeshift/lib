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
  gasLimit,
  tradeFee
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
  tradeFee: string
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

    console.log('calling getThorTxInfo with', destinationAddress)
    const { data, router } = await getThorTxInfo({
      deps,
      sellAsset,
      buyAsset,
      sellAmount,
      slippageTolerance,
      destinationAddress,
      tradeFee
    })

    return adapter.buildCustomTx({
      wallet,
      bip44Params,
      to: router,
      gasLimit,
      ...(gasPrice !== undefined
        ? {
            gasPrice
          }
        : {
            maxFeePerGas,
            maxPriorityFeePerGas
          }),
      value: isErc20Trade ? '0' : numberToHex(sellAmount),
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
