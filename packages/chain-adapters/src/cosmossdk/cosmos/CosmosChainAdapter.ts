/* eslint-disable prettier/prettier */
import { ChainReference } from '@shapeshiftoss/caip/dist/caip2/caip2'
import {
  bip32ToAddressNList,
  CosmosSignTx,
  CosmosTx,
  CosmosWallet
} from '@shapeshiftoss/hdwallet-core'
import { BIP44Params, chainAdapters, ChainTypes } from '@shapeshiftoss/types'
import BigNumber from 'bignumber.js'

import { ChainAdapter as IChainAdapter } from '../../api'
import { ErrorHandler } from '../../error/ErrorHandler'
import { toPath } from '../../utils'
import { ChainAdapterArgs, CosmosSdkBaseAdapter } from '../CosmosSdkBaseAdapter'

// import { cosmos } from '@shapeshiftoss/unchained-client'

export class ChainAdapter extends CosmosSdkBaseAdapter<ChainTypes.Cosmos>
  implements IChainAdapter<ChainTypes.Cosmos> {
  public static readonly defaultBIP44Params: BIP44Params = {
    purpose: 44,
    coinType: 118,
    accountNumber: 0
  }

  constructor(args: ChainAdapterArgs) {
    super()
    this.setChainSpecificProperties(args)
  }

  getType(): ChainTypes.Cosmos {
    return ChainTypes.Cosmos
  }

  async getAddress(input: chainAdapters.GetAddressInput): Promise<string> {
    const { wallet, bip44Params = ChainAdapter.defaultBIP44Params } = input
    const path = toPath(bip44Params)
    const addressNList = bip32ToAddressNList(path)
    const cosmosAddress = await (wallet as CosmosWallet).cosmosGetAddress({
      addressNList,
      showDisplay: Boolean(input.showOnDevice)
    })
    return cosmosAddress as string
  }

  async signTransaction(signTxInput: chainAdapters.SignTxInput<CosmosSignTx>): Promise<string> {
    try {
      const { txToSign, wallet } = signTxInput
      const signedTx = await (wallet as CosmosWallet).cosmosSignTx(txToSign)

      if (!signedTx) throw new Error('Error signing tx')

      // Make generic or union type for signed transactions and return
      return JSON.stringify(signedTx)
    } catch (err) {
      return ErrorHandler(err)
    }
  }

  async buildSendTransaction(
    tx: chainAdapters.BuildSendTxInput<ChainTypes.Cosmos>
  ): Promise<{ txToSign: CosmosSignTx }> {
    try {
      const {
        to,
        wallet,
        bip44Params = CosmosSdkBaseAdapter.defaultBIP44Params,
        chainSpecific: { gas },
        sendMax = false,
        value
      } = tx

      if (!to) throw new Error('CosmosChainAdapter: to is required')
      if (!value) throw new Error('CosmosChainAdapter: value is required')

      const path = toPath(bip44Params)
      const addressNList = bip32ToAddressNList(path)
      const from = await this.getAddress({ bip44Params, wallet })

      if (sendMax) {
        const account = await this.getAccount(from)
        tx.value = new BigNumber(account.balance).minus(gas).toString()
      }

      const utx: CosmosTx = {
        fee: {
          amount: [
            {
              amount: new BigNumber(gas).toString(),
              denom: 'uatom'
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
                  amount: new BigNumber(value).toString(),
                  denom: 'uatom'
                }
              ],
              from_address: from,
              to_address: to
            }
          }
        ],
        signatures: [],
        memo: ''
      }

      const txToSign: CosmosSignTx = {
        addressNList,
        tx: utx,
        chain_id: ChainReference.CosmosMainnet,
        account_number: '',
        sequence: ''
      }
      return { txToSign }
    } catch (err) {
      return ErrorHandler(err)
    }
  }
}
