import { ASSET_REFERENCE, AssetId, avalancheAssetId } from '@shapeshiftoss/caip'
import { BIP44Params, KnownChainIds } from '@shapeshiftoss/types'
import * as unchained from '@shapeshiftoss/unchained-client'

import { ChainAdapterDisplayName } from '../../types'
import { FeeDataEstimate, GetFeeDataInput } from '../../types'
import { bn, bnOrZero } from '../../utils/bignumber'
import { calcFee, ChainAdapterArgs, EvmBaseAdapter } from '../EvmBaseAdapter'
import { GasFeeDataEstimate } from '../types'

const SUPPORTED_CHAIN_IDS = [KnownChainIds.AvalancheMainnet]
const DEFAULT_CHAIN_ID = KnownChainIds.AvalancheMainnet

export class ChainAdapter extends EvmBaseAdapter<KnownChainIds.AvalancheMainnet> {
  public static readonly defaultBIP44Params: BIP44Params = {
    purpose: 44,
    coinType: Number(ASSET_REFERENCE.AvalancheC),
    accountNumber: 0,
  }

  private readonly api: unchained.avalanche.V1Api

  constructor(args: ChainAdapterArgs<unchained.avalanche.V1Api>) {
    super({
      chainId: DEFAULT_CHAIN_ID,
      supportedChainIds: SUPPORTED_CHAIN_IDS,
      defaultBIP44Params: ChainAdapter.defaultBIP44Params,
      ...args,
    })

    this.api = args.providers.http
    this.assetId = avalancheAssetId
    this.parser = new unchained.avalanche.TransactionParser({
      chainId: this.chainId,
      rpcUrl: this.rpcUrl,
    })
  }

  getDisplayName() {
    return ChainAdapterDisplayName.Avalanche
  }

  getName() {
    const enumIndex = Object.values(ChainAdapterDisplayName).indexOf(
      ChainAdapterDisplayName.Avalanche,
    )
    return Object.keys(ChainAdapterDisplayName)[enumIndex]
  }

  getType(): KnownChainIds.AvalancheMainnet {
    return KnownChainIds.AvalancheMainnet
  }

  getFeeAssetId(): AssetId {
    return this.assetId
  }

  async getGasFeeData(): Promise<GasFeeDataEstimate> {
    const feeData = await this.providers.http.getGasFees()

    const scalars = { fast: bn(1.2), average: bn(1), slow: bn(0.8) }

    return {
      fast: {
        gasPrice: calcFee(feeData.gasPrice, 'fast', scalars),
        ...(feeData.maxFeePerGas &&
          feeData.maxPriorityFeePerGas && {
            maxFeePerGas: calcFee(feeData.maxFeePerGas, 'fast', scalars),
            maxPriorityFeePerGas: calcFee(feeData.maxPriorityFeePerGas, 'fast', scalars),
          }),
      },
      average: {
        gasPrice: calcFee(feeData.gasPrice, 'average', scalars),
        ...(feeData.maxFeePerGas &&
          feeData.maxPriorityFeePerGas && {
            maxFeePerGas: calcFee(feeData.maxFeePerGas, 'average', scalars),
            maxPriorityFeePerGas: calcFee(feeData.maxPriorityFeePerGas, 'average', scalars),
          }),
      },
      slow: {
        gasPrice: calcFee(feeData.gasPrice, 'slow', scalars),
        ...(feeData.maxFeePerGas &&
          feeData.maxPriorityFeePerGas && {
            maxFeePerGas: calcFee(feeData.maxFeePerGas, 'slow', scalars),
            maxPriorityFeePerGas: calcFee(feeData.maxPriorityFeePerGas, 'slow', scalars),
          }),
      },
    }
  }

  async getFeeData(
    input: GetFeeDataInput<KnownChainIds.AvalancheMainnet>,
  ): Promise<FeeDataEstimate<KnownChainIds.AvalancheMainnet>> {
    const req = await this.buildEstimateGasRequest(input)

    const { gasLimit } = await this.api.estimateGas(req)
    const { fast, average, slow } = await this.getGasFeeData()

    return {
      fast: {
        txFee: bnOrZero(bn(fast.gasPrice).times(gasLimit)).toPrecision(),
        chainSpecific: { gasLimit, ...fast },
      },
      average: {
        txFee: bnOrZero(bn(average.gasPrice).times(gasLimit)).toPrecision(),
        chainSpecific: { gasLimit, ...average },
      },
      slow: {
        txFee: bnOrZero(bn(slow.gasPrice).times(gasLimit)).toPrecision(),
        chainSpecific: { gasLimit, ...slow },
      },
    }
  }
}
