import { AssetNamespace, AssetReference, caip2, CAIP19, caip19 } from '@shapeshiftoss/caip'
import {
  bip32ToAddressNList,
  OsmosisSignTx,
  OsmosisTx,
  supportsOsmosis
} from '@shapeshiftoss/hdwallet-core'
import { BIP44Params, chainAdapters, ChainTypes } from '@shapeshiftoss/types'
import * as unchained from '@shapeshiftoss/unchained-client'

import { ChainAdapter as IChainAdapter } from '../../api'
import { ErrorHandler } from '../../error/ErrorHandler'
import { bnOrZero, toPath } from '../../utils'
import { ChainAdapterArgs, CosmosSdkBaseAdapter } from '../CosmosSdkBaseAdapter'
export class ChainAdapter
  extends CosmosSdkBaseAdapter<ChainTypes.Osmosis>
  implements IChainAdapter<ChainTypes.Osmosis>
{
  protected readonly supportedChainIds = ['cosmos:osmosis-1', 'cosmos:osmo-testnet-1']
  protected readonly chainId = this.supportedChainIds[0]
  protected readonly assetId: CAIP19

  public static readonly defaultBIP44Params: BIP44Params = {
    purpose: 44,
    coinType: 118,
    accountNumber: 0
  }

  constructor(args: ChainAdapterArgs) {
    super(args)

    const { chain, network } = caip2.fromCAIP2(this.chainId)

    this.assetId = caip19.toCAIP19({
      chain,
      network,
      assetNamespace: AssetNamespace.Slip44,
      assetReference: AssetReference.Osmosis
    })

    this.parser = new unchained.osmosis.TransactionParser({ chainId: this.chainId })
  }

  getType(): ChainTypes.Osmosis {
    return ChainTypes.Osmosis
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
    tx: chainAdapters.BuildSendTxInput<ChainTypes.Osmosis>
  ): Promise<{ txToSign: OsmosisSignTx }> {
    try {
      const {
        to,
        wallet,
        bip44Params = CosmosSdkBaseAdapter.defaultBIP44Params,
        chainSpecific: { gas, fee },
        sendMax = false,
        value,
        memo = ''
      } = tx

      if (!to) throw new Error('OsmosisChainAdapter: to is required')
      if (!value) throw new Error('OsmosisChainAdapter: value is required')

      const path = toPath(bip44Params)
      const addressNList = bip32ToAddressNList(path)
      const from = await this.getAddress({ bip44Params, wallet })

      const account = await this.getAccount(from)

      if (sendMax) {
        try {
          const val = bnOrZero(account.balance).minus(gas)
          if (val.isFinite() || val.lte(0)) {
            throw new Error(`OsmosisChainAdapter: transaction value is invalid: ${val.toString()}`)
          }
          tx.value = val.toString()
        } catch (error) {
          return ErrorHandler(error)
        }
      }

      const utx: OsmosisTx = {
        fee: {
          amount: [
            {
              amount: bnOrZero(fee).toString(),
              denom: 'uosmo'
            }
          ],
          gas: gas
        },
        msg: [
          {
            type: 'cosmos-sdk/MsgSend',
            value: {
              amount: [
                {
                  amount: bnOrZero(value).toString(),
                  denom: 'uosmo'
                }
              ],
              from_address: from,
              to_address: to
            }
          }
        ],
        signatures: [],
        memo
      }

      const txToSign: OsmosisSignTx = {
        addressNList,
        tx: utx,
        chain_id: caip2.ChainReference.OsmosisMainnet,
        account_number: account.chainSpecific.accountNumber,
        sequence: account.chainSpecific.sequence.toString()
      }
      return { txToSign }
    } catch (err) {
      return ErrorHandler(err)
    }
  }

  async buildDelegateTransaction(
    tx: chainAdapters.BuildDelegateTxInput<ChainTypes.Osmosis>
  ): Promise<{ txToSign: OsmosisSignTx }> {
    throw new Error('Method not implemented.')
  }

  async buildUndelegateTransaction(
    tx: chainAdapters.BuildUndelegateTxInput<ChainTypes.Osmosis>
  ): Promise<{ txToSign: OsmosisSignTx }> {
    throw new Error('Method not implemented.')
  }

  async buildClaimRewardsTransaction(
    tx: chainAdapters.BuildClaimRewardsTxInput<ChainTypes.Osmosis>
  ): Promise<{ txToSign: OsmosisSignTx }> {
    throw new Error('Method not implemented.')
  }

  async buildRedelegateTransaction(
    tx: chainAdapters.BuildRedelegateTxInput<ChainTypes.Osmosis>
  ): Promise<{ txToSign: OsmosisSignTx }> {
    throw new Error('Method not implemented.')
  }

  async getFeeData({
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars -- Disable no-unused-vars lint rule for unimplemented variable */
    sendMax
  }: Partial<chainAdapters.GetFeeDataInput<ChainTypes.Osmosis>>): Promise<
    chainAdapters.FeeDataEstimate<ChainTypes.Osmosis>
  > {
    // We currently don't have a way to query validators to get dynamic fees, so they are hard coded.
    // When we find a strategy to make this more dynamic, we can use 'sendMax' to define max amount.
    return {
      [chainAdapters.FeeDataKey.Fast]: {
        txFee: '5000',
        chainSpecific: { gasLimit: '250000' }
      },
      [chainAdapters.FeeDataKey.Average]: {
        txFee: '3500',
        chainSpecific: { gasLimit: '250000' }
      },
      [chainAdapters.FeeDataKey.Slow]: {
        txFee: '2500',
        chainSpecific: { gasLimit: '250000' }
      }
    }
  }

  async signAndBroadcastTransaction(
    signTxInput: chainAdapters.SignTxInput<OsmosisSignTx>
  ): Promise<string> {
    const { wallet } = signTxInput
    try {
      if (supportsOsmosis(wallet)) {
        const signedTx = await this.signTransaction(signTxInput)
        const { data } = await this.providers.http.sendTx({ body: { rawTx: signedTx } })
        return data
      } else {
        throw new Error('Wallet does not support Cosmos.')
      }
    } catch (error) {
      return ErrorHandler(error)
    }
  }
}
