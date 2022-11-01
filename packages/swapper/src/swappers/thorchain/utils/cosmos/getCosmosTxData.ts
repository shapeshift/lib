import { Asset } from '@shapeshiftoss/asset-service'
import { ChainId } from '@shapeshiftoss/caip'
import { ChainAdapter, cosmos, thorchain } from '@shapeshiftoss/chain-adapters'
import { HDWallet } from '@shapeshiftoss/hdwallet-core'
import { BIP44Params, KnownChainIds } from '@shapeshiftoss/types'
import { getInboundAddressesForChain } from 'packages/swapper/src/swappers/thorchain/utils/getInboundAddressesForChain'

import { SwapError, SwapErrorTypes, TradeQuote } from '../../../../api'
import { ThorchainSwapperDeps } from '../../types'
import { getLimit } from '../getLimit/getLimit'
import { makeSwapMemo } from '../makeSwapMemo/makeSwapMemo'

type GetCosmosTxDataInput = {
  bip44Params: BIP44Params
  destinationAddress: string
  deps: ThorchainSwapperDeps
  sellAmountCryptoPrecision: string
  sellAsset: Asset
  buyAsset: Asset
  slippageTolerance: string
  wallet: HDWallet
  quote: TradeQuote<KnownChainIds.CosmosMainnet>
  chainId: ChainId
  sellAdapter: ChainAdapter<KnownChainIds.CosmosMainnet>
}

export const getCosmosTxData = async (input: GetCosmosTxDataInput) => {
  const {
    bip44Params,
    deps,
    destinationAddress,
    sellAmountCryptoPrecision,
    sellAsset,
    buyAsset,
    slippageTolerance,
    quote,
    wallet,
    sellAdapter,
  } = input
  const fromThorAsset = sellAsset.chainId == KnownChainIds.ThorchainMainnet
  const { address: vault } = await getInboundAddressesForChain(deps.daemonUrl, 'GAIA')

  if (!vault && !fromThorAsset)
    throw new SwapError('[buildTrade]: no vault for chain', {
      code: SwapErrorTypes.BUILD_TRADE_FAILED,
      fn: 'buildTrade',
      details: { chainId: input.chainId },
    })

  const limit = await getLimit({
    buyAssetId: buyAsset.assetId,
    destinationAddress,
    sellAmountCryptoPrecision,
    sellAsset,
    slippageTolerance,
    deps,
    buyAssetTradeFeeUsd: quote.feeData.buyAssetTradeFeeUsd,
  })

  const memo = makeSwapMemo({
    buyAssetId: buyAsset.assetId,
    destinationAddress,
    limit,
  })

  const builtTxResponse = await (async () => {
    switch (true) {
      case fromThorAsset:
        return await (sellAdapter as unknown as thorchain.ChainAdapter).buildDepositTransaction({
          bip44Params,
          value: sellAmountCryptoPrecision,
          wallet,
          memo,
          chainSpecific: {
            gas: quote.feeData.chainSpecific.estimatedGas,
            fee: quote.feeData.networkFee,
          },
        })
      default:
        if (!vault)
          throw new SwapError('[buildTrade]: no vault for chain', {
            code: SwapErrorTypes.BUILD_TRADE_FAILED,
            fn: 'buildTrade',
            details: { chainId: input.chainId },
          })
        return await (sellAdapter as unknown as cosmos.ChainAdapter).buildSendTransaction({
          bip44Params,
          value: sellAmountCryptoPrecision,
          wallet,
          to: vault,
          memo,
          chainSpecific: {
            gas: (quote as TradeQuote<KnownChainIds.CosmosMainnet>).feeData.chainSpecific
              .estimatedGas,
            fee: quote.feeData.networkFee,
          },
        })
    }
  })()

  return builtTxResponse.txToSign
}
