import { bip32ToAddressNList, OsmosisSignTx, OsmosisWallet } from '@shapeshiftoss/hdwallet-core'
import { BIP44Params, chainAdapters, ChainTypes } from '@shapeshiftoss/types'

import { ChainAdapter as IChainAdapter } from '../../api'
import { ErrorHandler } from '../../error/ErrorHandler'
import { toPath } from '../../utils'
import { ChainAdapterArgs, CosmosSdkBaseAdapter } from '../CosmosSdkBaseAdapter'
export class ChainAdapter
  extends CosmosSdkBaseAdapter<ChainTypes.Osmosis>
  implements IChainAdapter<ChainTypes.Osmosis>
{
  protected readonly supportedChainIds = ['cosmos:osmosis-1', 'cosmos:osmo-testnet-1']
  protected readonly chainId = this.supportedChainIds[0]

  public static readonly defaultBIP44Params: BIP44Params = {
    purpose: 44,
    coinType: 118,
    accountNumber: 0
  }

  constructor(args: ChainAdapterArgs) {
    super(args)
  }

  getType(): ChainTypes.Osmosis {
    return ChainTypes.Osmosis
  }

  async getAddress(input: chainAdapters.GetAddressInput): Promise<string> {
    const { wallet, bip44Params = ChainAdapter.defaultBIP44Params } = input
    const path = toPath(bip44Params)
    const addressNList = bip32ToAddressNList(path)
    const osmosisAddress = await (wallet as OsmosisWallet).osmosisGetAddress({
      addressNList,
      showDisplay: Boolean(input.showOnDevice)
    })
    return osmosisAddress as string
  }

  async signTransaction(signTxInput: chainAdapters.SignTxInput<OsmosisSignTx>): Promise<string> {
    try {
      const { txToSign, wallet } = signTxInput
      const signedTx = await (wallet as OsmosisWallet).osmosisSignTx(txToSign)

      if (!signedTx) throw new Error('Error signing tx')

      return signedTx.serialized
    } catch (err) {
      return ErrorHandler(err)
    }
  }
}
