/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { caip2 } from '@shapeshiftoss/caip'
import { ChainAdapter, toPath } from '@shapeshiftoss/chain-adapters'
import { HDWallet } from '@shapeshiftoss/hdwallet-core'
import { bip32ToAddressNList, CosmosSignTx } from '@shapeshiftoss/hdwallet-core'
import { ChainTypes } from '@shapeshiftoss/types'
import axios from 'axios'

import { PendingInfo, StakeActionInput, Staker, StakingInfo } from './api'

// taxistake
const DEFAULT_VALIDATOR = 'osmovaloper1vkfmegxrsveefn2wmudh7apxuzu2n77654ad62'

type SupportedChainAdapters = ChainAdapter<ChainTypes.Cosmos> | ChainAdapter<ChainTypes.Osmosis>

export type ConstructorArgs = {
  url: string
  wallet: HDWallet
  chainAdapter: SupportedChainAdapters
}

export class Investor implements Staker {
  url: string
  chainAdapter: SupportedChainAdapters
  chainId: string
  denom: string

  constructor(args: ConstructorArgs) {
    this.url = args.url
    this.chainAdapter = args.chainAdapter

    if (this.chainAdapter.getType() === ChainTypes.Cosmos) {
      this.denom = 'uatom'
      this.chainId = caip2.ChainReference.CosmosHubMainnet
    } else if (this.chainAdapter.getType() === ChainTypes.Osmosis) {
      this.denom = 'uosmo'
      this.chainId = caip2.ChainReference.OsmosisMainnet
    } else throw new Error(`Unsupported chain type ${this.chainAdapter.getType()}`)
  }

  async stake(input: StakeActionInput): Promise<string> {
    const { wallet, bip44Params } = input

    // TODO these values from unchained
    const accountNumber = 1
    const sequence = 1

    const userAddress = this.chainAdapter.getAddress({ wallet, bip44Params })

    // Eventually we should add these to StakeActionInput
    // Hard coded is fine for now because fees are so low
    const feeAmount = '3000'
    const gas = '300000'
    const memo = ''

    const tx: any = {
      account_number: accountNumber,
      chain_id: this.chainId,
      sequence,
      fee: {
        amount: [
          {
            amount: feeAmount,
            denom: this.denom
          }
        ],
        gas
      },
      memo,
      msg: [
        {
          type: 'cosmos-sdk/MsgDelegate',
          value: {
            delegator_address: userAddress,
            validator_address: DEFAULT_VALIDATOR,
            amount: {
              denom: this.denom,
              amount: input.amount
            }
          }
        }
      ]
    }
    const path = toPath(bip44Params)
    const addressNList = bip32ToAddressNList(path)

    const txToSign: CosmosSignTx = {
      addressNList,
      tx,
      chain_id: this.chainId,
      account_number: '',
      sequence: ''
    }

    const cosmosSignedTx = await this.chainAdapter.signTransaction({
      wallet,
      txToSign
    })
    throw new Error('Not implemented')
    return ''
  }

  async unstake(input: StakeActionInput): Promise<string> {
    throw new Error('Not implemented')
  }

  async claim(input: StakeActionInput): Promise<string> {
    throw new Error('Not implemented')
  }

  async getInfo(address: string): Promise<StakingInfo> {
    const stakedTxInfo = await axios.get(
      `${this.url}/staking/delegators/${address}/delegations/${DEFAULT_VALIDATOR}` // do we want to proxy this through unchained?
    )
    const rewardsTxInfo = await axios.get(
      `${this.url} + /distribution/delegators/ + ${address}/rewards` // do we want to proxy this through unchained?
    )

    const stakedAmount = stakedTxInfo?.data?.result?.balance?.amount
    const rewardAmount = rewardsTxInfo?.data?.result?.total[0]?.amount

    const pendingUnstakes = await this.pendingUnstakes(address)

    return {
      stakedAmount,
      rewardAmount,
      apr: 0.85, // TODO how do we calculate APR?
      pendingUnstakes
    }
  }

  private async pendingUnstakes(address: string | null): Promise<PendingInfo[]> {
    const txResponse = await axios.get(`${this.url}/txs/?message.sender=${address}`) // do we want to proxy this through unchained?

    const unstakes: PendingInfo[] = []

    txResponse.data.txs.forEach((transaction: any) => {
      transaction.logs.forEach((log: any) => {
        log.events.forEach((event: any) => {
          if (event.type === 'unbond') {
            const amount = event.attributes.find((attribute: any) => attribute.key === 'amount')
              .value
            const completionTimeEstimate = event.attributes.find(
              (attribute: any) => attribute.key === 'completion_time'
            ).value
            const timeInitiated = transaction.timestamp
            const txid = transaction.txhash

            const completedTimeMs = Date.parse(completionTimeEstimate)
            const currentTimeMs = Date.now()
            const timeRemainingMs = completedTimeMs - currentTimeMs
            if (timeRemainingMs > 0)
              unstakes.push({ amount, completionTimeEstimate, timeInitiated, txid })
          }
        })
      })
    })

    return unstakes
  }
}
