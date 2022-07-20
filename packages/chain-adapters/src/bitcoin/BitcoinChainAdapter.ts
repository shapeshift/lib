import { ASSET_REFERENCE, AssetId, ChainId, toAssetId } from '@shapeshiftoss/caip'
import { BTCOutputScriptType } from '@shapeshiftoss/hdwallet-core'
import { BIP44Params, KnownChainIds, UtxoAccountType } from '@shapeshiftoss/types'
import * as unchained from '@shapeshiftoss/unchained-client'

import { ChainAdapter as IChainAdapter } from '../api'
import { accountTypeToOutputScriptType } from '../utils'
import { ChainAdapterArgs, UTXOBaseAdapter, UtxoChainId } from '../utxo/UTXOBaseAdapter'

export class ChainAdapter
  extends UTXOBaseAdapter<KnownChainIds.BitcoinMainnet>
  implements IChainAdapter<KnownChainIds.BitcoinMainnet>
{
  public static readonly defaultBIP44Params: BIP44Params = {
    purpose: 84, // segwit native
    coinType: 0,
    accountNumber: 0
  }
  public static readonly defaultUtxoAccountType: UtxoAccountType = UtxoAccountType.SegwitNative

  private static readonly supportedAccountTypes: UtxoAccountType[] = [
    UtxoAccountType.SegwitNative,
    UtxoAccountType.SegwitP2sh,
    UtxoAccountType.P2pkh
  ]

  protected readonly supportedChainIds: UtxoChainId[] = [KnownChainIds.BitcoinMainnet]

  protected chainId = this.supportedChainIds[0]

  private parser: unchained.bitcoin.TransactionParser

  constructor(args: ChainAdapterArgs) {
    super(args)

    if (args.chainId && !this.supportedChainIds.includes(args.chainId)) {
      throw new Error(`Bitcoin chainId ${args.chainId} not supported`)
    }

    if (args.chainId) {
      this.chainId = args.chainId
    }

    this.coinName = args.coinName
    this.assetId = toAssetId({
      chainId: this.chainId,
      assetNamespace: 'slip44',
      assetReference: ASSET_REFERENCE.Bitcoin
    })
    this.parser = new unchained.bitcoin.TransactionParser({
      chainId: this.chainId,
      assetReference: ASSET_REFERENCE.Bitcoin
    })
  }

  getChainId(): ChainId {
    return KnownChainIds.BitcoinMainnet
  }

  getAssetId(): AssetId {
    return this.assetId
  }

  accountTypeToOutputScriptType(accountType: UtxoAccountType): BTCOutputScriptType {
    return accountTypeToOutputScriptType[accountType]
  }

  getDefaultAccountType(): UtxoAccountType {
    return ChainAdapter.defaultUtxoAccountType
  }

  getDefaultBip44Params(): BIP44Params {
    return ChainAdapter.defaultBIP44Params
  }

  getTransactionParser() {
    return this.parser
  }

  getDisplayName() {
    return 'Bitcoin'
  }

  getType(): KnownChainIds.BitcoinMainnet {
    return KnownChainIds.BitcoinMainnet
  }

  getFeeAssetId(): AssetId {
    return this.getAssetId()
  }

  getSupportedAccountTypes() {
    return ChainAdapter.supportedAccountTypes
  }

  buildBIP44Params(params: Partial<BIP44Params>): BIP44Params {
    return { ...ChainAdapter.defaultBIP44Params, ...params }
  }

  closeTxs(): void {
    this.providers.ws.close('txs')
  }
}
