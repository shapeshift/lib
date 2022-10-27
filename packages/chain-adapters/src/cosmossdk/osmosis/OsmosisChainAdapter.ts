import { ASSET_REFERENCE, AssetId, osmosisAssetId } from '@shapeshiftoss/caip'
import { OsmosisSignTx, supportsOsmosis } from '@shapeshiftoss/hdwallet-core'
import { BIP44Params, KnownChainIds } from '@shapeshiftoss/types'
import * as unchained from '@shapeshiftoss/unchained-client'

import { ErrorHandler } from '../../error/ErrorHandler'
import {
  BuildClaimRewardsTxInput,
  BuildDelegateTxInput,
  BuildRedelegateTxInput,
  BuildSendTxInput,
  BuildUndelegateTxInput,
  FeeDataEstimate,
  GetAddressInput,
  GetFeeDataInput,
  SignTxInput,
} from '../../types'
import { toAddressNList } from '../../utils'
import {
  assertIsValidatorAddress,
  ChainAdapterArgs,
  CosmosSdkBaseAdapter,
} from '../CosmosSdkBaseAdapter'
import { Message } from '../types'

const SUPPORTED_CHAIN_IDS = [KnownChainIds.OsmosisMainnet]
const DEFAULT_CHAIN_ID = KnownChainIds.OsmosisMainnet

export class ChainAdapter extends CosmosSdkBaseAdapter<KnownChainIds.OsmosisMainnet> {
  public static readonly defaultBIP44Params: BIP44Params = {
    purpose: 44,
    coinType: Number(ASSET_REFERENCE.Osmosis),
    accountNumber: 0,
  }

  constructor(args: ChainAdapterArgs) {
    super({
      denom: 'uosmo',
      chainId: DEFAULT_CHAIN_ID,
      supportedChainIds: SUPPORTED_CHAIN_IDS,
      defaultBIP44Params: ChainAdapter.defaultBIP44Params,
      ...args,
    })

    this.assetId = osmosisAssetId
    this.parser = new unchained.osmosis.TransactionParser({ chainId: this.chainId })
  }

  getDisplayName() {
    return 'Osmosis'
  }

  getType(): KnownChainIds.OsmosisMainnet {
    return KnownChainIds.OsmosisMainnet
  }

  getFeeAssetId(): AssetId {
    return this.assetId
  }

  async getAddress(input: GetAddressInput): Promise<string> {
    const { wallet, bip44Params = this.defaultBIP44Params, showOnDevice = false } = input

    try {
      if (supportsOsmosis(wallet)) {
        const osmosisAddress = await wallet.osmosisGetAddress({
          addressNList: toAddressNList(bip44Params),
          showDisplay: showOnDevice,
        })
        if (!osmosisAddress) {
          throw new Error('Unable to generate Osmosis address.')
        }
        return osmosisAddress
      } else {
        throw new Error('Wallet does not support Osmosis.')
      }
    } catch (error) {
      return ErrorHandler(error)
    }
  }

  async signTransaction(signTxInput: SignTxInput<OsmosisSignTx>): Promise<string> {
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
    tx: BuildSendTxInput<KnownChainIds.OsmosisMainnet>,
  ): Promise<{ txToSign: OsmosisSignTx }> {
    try {
      const { to, wallet, bip44Params = this.defaultBIP44Params, value } = tx

      if (!to) throw new Error('OsmosisChainAdapter: to is required')
      if (!value) throw new Error('OsmosisChainAdapter: value is required')

      const from = await this.getAddress({ bip44Params, wallet })

      const msg: Message = {
        type: 'cosmos-sdk/MsgSend',
        value: {
          from_address: from,
          to_address: to,
        },
      }

      return this.buildTransaction({ ...tx, from, msg })
    } catch (err) {
      return ErrorHandler(err)
    }
  }

  async buildDelegateTransaction(
    tx: BuildDelegateTxInput<KnownChainIds.OsmosisMainnet>,
  ): Promise<{ txToSign: OsmosisSignTx }> {
    try {
      const { validator, wallet, bip44Params = this.defaultBIP44Params, value } = tx

      if (!value) throw new Error('OsmosisChainAdapter: value is required')
      if (!validator) throw new Error('OsmosisChainAdapter: validator is required')

      assertIsValidatorAddress(validator, this.getType())

      const from = await this.getAddress({ bip44Params, wallet })

      const msg: Message = {
        type: 'cosmos-sdk/MsgDelegate',
        value: {
          delegator_address: from,
          validator_address: validator,
        },
      }

      return this.buildTransaction({ ...tx, from, msg })
    } catch (err) {
      return ErrorHandler(err)
    }
  }

  async buildUndelegateTransaction(
    tx: BuildUndelegateTxInput<KnownChainIds.OsmosisMainnet>,
  ): Promise<{ txToSign: OsmosisSignTx }> {
    try {
      const { validator, wallet, bip44Params = this.defaultBIP44Params, value } = tx

      if (!value) throw new Error('OsmosisChainAdapter: value is required')
      if (!validator) throw new Error('OsmosisChainAdapter: validator is required')

      assertIsValidatorAddress(validator, this.getType())

      const from = await this.getAddress({ bip44Params, wallet })

      const msg: Message = {
        type: 'cosmos-sdk/MsgUndelegate',
        value: {
          delegator_address: from,
          validator_address: validator,
        },
      }

      return this.buildTransaction({ ...tx, from, msg })
    } catch (err) {
      return ErrorHandler(err)
    }
  }

  async buildRedelegateTransaction(
    tx: BuildRedelegateTxInput<KnownChainIds.OsmosisMainnet>,
  ): Promise<{ txToSign: OsmosisSignTx }> {
    try {
      const {
        wallet,
        bip44Params = this.defaultBIP44Params,
        value,
        fromValidator,
        toValidator,
      } = tx

      if (!value) throw new Error('OsmosisChainAdapter: value is required')
      if (!toValidator) throw new Error('OsmosisChainAdapter: toValidator is required')
      if (!fromValidator) throw new Error('OsmosisChainAdapter: fromValidator is required')

      assertIsValidatorAddress(toValidator, this.getType())
      assertIsValidatorAddress(fromValidator, this.getType())

      const from = await this.getAddress({ bip44Params, wallet })

      const msg: Message = {
        type: 'cosmos-sdk/MsgBeginRedelegate',
        value: {
          delegator_address: from,
          validator_src_address: fromValidator,
          validator_dst_address: toValidator,
        },
      }

      return this.buildTransaction({ ...tx, from, msg })
    } catch (err) {
      return ErrorHandler(err)
    }
  }

  async buildClaimRewardsTransaction(
    tx: BuildClaimRewardsTxInput<KnownChainIds.OsmosisMainnet>,
  ): Promise<{ txToSign: OsmosisSignTx }> {
    try {
      const { validator, wallet, bip44Params = this.defaultBIP44Params } = tx

      if (!validator) throw new Error('OsmosisChainAdapter: validator is required')

      assertIsValidatorAddress(validator, this.getType())

      const from = await this.getAddress({ bip44Params, wallet })

      const msg: Message = {
        type: 'cosmos-sdk/MsgWithdrawDelegationReward',
        value: {
          delegator_address: from,
          validator_address: validator,
        },
      }

      return this.buildTransaction({ ...tx, from, msg })
    } catch (err) {
      return ErrorHandler(err)
    }
  }

  // @ts-ignore - keep type signature with unimplemented state
  async getFeeData({
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars -- Disable no-unused-vars lint rule for unimplemented variable */
    sendMax,
  }: Partial<GetFeeDataInput<KnownChainIds.OsmosisMainnet>>): Promise<
    FeeDataEstimate<KnownChainIds.OsmosisMainnet>
  > {
    // We currently don't have a way to query validators to get dynamic fees, so they are hard coded.
    // When we find a strategy to make this more dynamic, we can use 'sendMax' to define max amount.
    return {
      fast: { txFee: '5000', chainSpecific: { gasLimit: '300000' } },
      average: { txFee: '3500', chainSpecific: { gasLimit: '300000' } },
      slow: { txFee: '2500', chainSpecific: { gasLimit: '300000' } },
    }
  }

  async signAndBroadcastTransaction(signTxInput: SignTxInput<OsmosisSignTx>): Promise<string> {
    const { wallet } = signTxInput
    try {
      if (supportsOsmosis(wallet)) {
        const signedTx = await this.signTransaction(signTxInput)
        return this.providers.http.sendTx({ body: { rawTx: signedTx } })
      } else {
        throw new Error('Wallet does not support Osmosis.')
      }
    } catch (error) {
      return ErrorHandler(error)
    }
  }
}
