import { ASSET_REFERENCE, AssetId, cosmosAssetId } from '@shapeshiftoss/caip'
import { CosmosSignTx, supportsCosmos } from '@shapeshiftoss/hdwallet-core'
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

const SUPPORTED_CHAIN_IDS = [KnownChainIds.CosmosMainnet]
const DEFAULT_CHAIN_ID = KnownChainIds.CosmosMainnet

export class ChainAdapter extends CosmosSdkBaseAdapter<KnownChainIds.CosmosMainnet> {
  static readonly defaultBIP44Params: BIP44Params = {
    purpose: 44,
    coinType: Number(ASSET_REFERENCE.Cosmos),
    accountNumber: 0,
  }

  constructor(args: ChainAdapterArgs) {
    super({
      denom: 'uatom',
      chainId: DEFAULT_CHAIN_ID,
      supportedChainIds: SUPPORTED_CHAIN_IDS,
      defaultBIP44Params: ChainAdapter.defaultBIP44Params,
      ...args,
    })

    this.assetId = cosmosAssetId
    this.parser = new unchained.cosmos.TransactionParser({ chainId: this.chainId })
  }

  getDisplayName() {
    return 'Cosmos'
  }

  getType(): KnownChainIds.CosmosMainnet {
    return KnownChainIds.CosmosMainnet
  }

  getFeeAssetId(): AssetId {
    return this.assetId
  }

  async getAddress(input: GetAddressInput): Promise<string> {
    const { wallet, bip44Params = ChainAdapter.defaultBIP44Params, showOnDevice = false } = input

    try {
      if (supportsCosmos(wallet)) {
        const cosmosAddress = await wallet.cosmosGetAddress({
          addressNList: toAddressNList(bip44Params),
          showDisplay: showOnDevice,
        })
        if (!cosmosAddress) {
          throw new Error('Unable to generate Cosmos address.')
        }
        return cosmosAddress
      } else {
        throw new Error('Wallet does not support Cosmos.')
      }
    } catch (error) {
      return ErrorHandler(error)
    }
  }

  async buildSendTransaction(
    tx: BuildSendTxInput<KnownChainIds.CosmosMainnet>,
  ): Promise<{ txToSign: CosmosSignTx }> {
    try {
      const { to, wallet, bip44Params = this.defaultBIP44Params, value } = tx

      if (!to) throw new Error('CosmosChainAdapter: to is required')
      if (!value) throw new Error('CosmosChainAdapter: value is required')

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
    tx: BuildDelegateTxInput<KnownChainIds.CosmosMainnet>,
  ): Promise<{ txToSign: CosmosSignTx }> {
    try {
      const { validator, wallet, bip44Params = this.defaultBIP44Params, value } = tx

      if (!value) throw new Error('CosmosChainAdapter: value is required')
      if (!validator) throw new Error('CosmosChainAdapter: validator is required')

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
    tx: BuildUndelegateTxInput<KnownChainIds.CosmosMainnet>,
  ): Promise<{ txToSign: CosmosSignTx }> {
    try {
      const { validator, wallet, bip44Params = this.defaultBIP44Params, value } = tx

      if (!value) throw new Error('CosmosChainAdapter: value is required')
      if (!validator) throw new Error('CosmosChainAdapter: validator is required')

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
    tx: BuildRedelegateTxInput<KnownChainIds.CosmosMainnet>,
  ): Promise<{ txToSign: CosmosSignTx }> {
    try {
      const {
        wallet,
        bip44Params = this.defaultBIP44Params,
        value,
        fromValidator,
        toValidator,
      } = tx

      if (!value) throw new Error('CosmosChainAdapter: value is required')
      if (!toValidator) throw new Error('CosmosChainAdapter: toValidator is required')
      if (!fromValidator) throw new Error('CosmosChainAdapter: fromValidator is required')

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
    tx: BuildClaimRewardsTxInput<KnownChainIds.CosmosMainnet>,
  ): Promise<{ txToSign: CosmosSignTx }> {
    try {
      const { validator, wallet, bip44Params = this.defaultBIP44Params } = tx

      if (!validator) throw new Error('CosmosChainAdapter: validator is required')

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

  async signTransaction(signTxInput: SignTxInput<CosmosSignTx>): Promise<string> {
    try {
      const { txToSign, wallet } = signTxInput
      if (supportsCosmos(wallet)) {
        const signedTx = await wallet.cosmosSignTx(txToSign)

        if (!signedTx) throw new Error('Error signing tx')

        return signedTx.serialized
      } else {
        throw new Error('Wallet does not support Cosmos.')
      }
    } catch (err) {
      return ErrorHandler(err)
    }
  }

  // @ts-ignore - keep type signature with unimplemented state
  async getFeeData({
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars -- Disable no-unused-vars lint rule for unimplemented variable */
    sendMax,
  }: Partial<GetFeeDataInput<KnownChainIds.CosmosMainnet>>): Promise<
    FeeDataEstimate<KnownChainIds.CosmosMainnet>
  > {
    // We currently don't have a way to query validators to get dynamic fees, so they are hard coded.
    // When we find a strategy to make this more dynamic, we can use 'sendMax' to define max amount.
    return {
      fast: { txFee: '5000', chainSpecific: { gasLimit: '250000' } },
      average: { txFee: '3500', chainSpecific: { gasLimit: '250000' } },
      slow: { txFee: '2500', chainSpecific: { gasLimit: '250000' } },
    }
  }

  async signAndBroadcastTransaction(signTxInput: SignTxInput<CosmosSignTx>): Promise<string> {
    const { wallet } = signTxInput
    try {
      if (supportsCosmos(wallet)) {
        const signedTx = await this.signTransaction(signTxInput)
        return this.providers.http.sendTx({ body: { rawTx: signedTx } })
      } else {
        throw new Error('Wallet does not support Cosmos.')
      }
    } catch (error) {
      return ErrorHandler(error)
    }
  }
}
