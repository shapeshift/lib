import { CAIP2, WellKnownChain } from '@shapeshiftoss/caip'
import { bip32ToAddressNList, OsmosisSignTx, supportsOsmosis } from '@shapeshiftoss/hdwallet-core'
import { BIP44Params, chainAdapters, ChainAdapterType } from '@shapeshiftoss/types'

import { ChainAdapter as IChainAdapter } from '../../api'
import { ErrorHandler } from '../../error/ErrorHandler'
import { toPath } from '../../utils'
import { ChainAdapterArgs, CosmosSdkBaseAdapter } from '../CosmosSdkBaseAdapter'

export class ChainAdapter
  extends CosmosSdkBaseAdapter<ChainAdapterType.Osmosis>
  implements IChainAdapter<ChainAdapterType.Osmosis>
{
  protected static readonly supportedChainIds: CAIP2[] = [
    WellKnownChain.OsmosisMainnet,
    WellKnownChain.OsmosisTestnet
  ]

  public static readonly defaultBIP44Params: BIP44Params = {
    purpose: 44,
    coinType: 118,
    accountNumber: 0
  }

  constructor(args: ChainAdapterArgs) {
    super(ChainAdapter.supportedChainIds, args)
  }

  getType(): ChainAdapterType.Osmosis {
    return ChainAdapterType.Osmosis
  }

  async getAddress(input: chainAdapters.GetAddressInput): Promise<string> {
    const { wallet, bip44Params = ChainAdapter.defaultBIP44Params } = input
    const path = toPath(bip44Params)
    const addressNList = bip32ToAddressNList(path)
    try {
      if (supportsOsmosis(wallet)) {
        const osmosisAddress = await wallet.osmosisGetAddress({
          addressNList,
          showDisplay: Boolean(input.showOnDevice)
        })
        if (!osmosisAddress) {
          throw new Error('Unable to generate Osmosis address')
        }
        return osmosisAddress as string
      } else {
        throw new Error('Wallet does not support Osmosis.')
      }
    } catch (error) {
      return ErrorHandler(error)
    }
  }

  async signTransaction(signTxInput: chainAdapters.SignTxInput<OsmosisSignTx>): Promise<string> {
    try {
      const { txToSign, wallet } = signTxInput
      if (supportsOsmosis(wallet)) {
        const signedTx = await wallet.osmosisSignTx(txToSign)

        if (!signedTx) throw new Error('Error signing tx')

        return signedTx.serialized
      } else {
        throw new Error('Wallet does not support Osmosis.')
      }
    } catch (err) {
      return ErrorHandler(err)
    }
  }

  async buildSendTransaction(
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars -- Disable no-unused-vars lint rule for unimplemented methods */
    tx: chainAdapters.BuildSendTxInput<ChainAdapterType.Osmosis>
  ): Promise<{ txToSign: chainAdapters.ChainTxType<ChainAdapterType.Osmosis> }> {
    throw new Error('Method not implemented.')
  }

  async getFeeData(
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars -- Disable no-unused-vars lint rule for unimplemented methods */
    input: Partial<chainAdapters.GetFeeDataInput<ChainAdapterType.Osmosis>>
  ): Promise<chainAdapters.FeeDataEstimate<ChainAdapterType.Osmosis>> {
    throw new Error('Method not implemented.')
  }

  async signAndBroadcastTransaction(
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars -- Disable no-unused-vars lint rule for unimplemented methods */
    signTxInput: chainAdapters.SignTxInput<OsmosisSignTx>
  ): Promise<string> {
    throw new Error('Method not implemented.')
  }
}
