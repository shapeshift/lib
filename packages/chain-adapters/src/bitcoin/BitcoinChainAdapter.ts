import { ASSET_REFERENCE, AssetId, ChainId, toAssetId } from '@shapeshiftoss/caip'
import { BTCOutputScriptType } from '@shapeshiftoss/hdwallet-core'
import { BIP44Params, KnownChainIds, UtxoAccountType } from '@shapeshiftoss/types'
import * as unchained from '@shapeshiftoss/unchained-client'

import { ChainAdapter as IChainAdapter } from '../api'
import { FeeDataEstimate, FeeDataKey, GetFeeDataInput } from '../types'
import { accountTypeToOutputScriptType } from '../utils'
import { ChainAdapterArgs, UTXOBaseAdapter, UtxoChainId } from '../utxo/UTXOBaseAdapter'
import { utxoSelect } from '../utxo/utxoSelect'

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
    return 'bip122:000000000019d6689c085ae165831e93/slip44:0'
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

  async getFeeData({
    to,
    value,
    chainSpecific: { pubkey, opReturnData },
    sendMax = false
  }: GetFeeDataInput<KnownChainIds.BitcoinMainnet>): Promise<
    FeeDataEstimate<KnownChainIds.BitcoinMainnet>
  > {
    const feeData = await this.providers.http.getNetworkFees()

    if (!to || !value || !pubkey) throw new Error('to, from, value and xpub are required')
    if (
      !feeData.data.fast?.satsPerKiloByte ||
      !feeData.data.average?.satsPerKiloByte ||
      !feeData.data.slow?.satsPerKiloByte
    )
      throw new Error('undefined fee')

    // We have to round because coinselect library uses sats per byte which cant be decimals
    const fastPerByte = String(Math.round(feeData.data.fast.satsPerKiloByte / 1024))
    const averagePerByte = String(Math.round(feeData.data.average.satsPerKiloByte / 1024))
    const slowPerByte = String(Math.round(feeData.data.slow.satsPerKiloByte / 1024))

    const { data: utxos } = await this.providers.http.getUtxos({
      pubkey
    })

    const utxoSelectInput = {
      to,
      value,
      opReturnData,
      utxos,
      sendMax
    }

    const { fee: fastFee } = utxoSelect({
      ...utxoSelectInput,
      satoshiPerByte: fastPerByte
    })
    const { fee: averageFee } = utxoSelect({
      ...utxoSelectInput,
      satoshiPerByte: averagePerByte
    })
    const { fee: slowFee } = utxoSelect({
      ...utxoSelectInput,
      satoshiPerByte: slowPerByte
    })

    return {
      [FeeDataKey.Fast]: {
        txFee: String(fastFee),
        chainSpecific: {
          satoshiPerByte: fastPerByte
        }
      },
      [FeeDataKey.Average]: {
        txFee: String(averageFee),
        chainSpecific: {
          satoshiPerByte: averagePerByte
        }
      },
      [FeeDataKey.Slow]: {
        txFee: String(slowFee),
        chainSpecific: {
          satoshiPerByte: slowPerByte
        }
      }
    }
  }
  closeTxs(): void {
    this.providers.ws.close('txs')
  }
}
