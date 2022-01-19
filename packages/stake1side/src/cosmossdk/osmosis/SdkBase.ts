/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { HDWallet } from '@shapeshiftoss/hdwallet-core'
import { Asset } from '@shapeshiftoss/types'
import axios from 'axios'

import { PendingInfo, StakeActionInput, Staker, StakingInfo } from '../../api'

export type ConstructorArgs = {
  url: string
  wallet: HDWallet
  asset: Asset
  validator: string
}

export class SdkBaseStaker implements Staker {
  url: string
  wallet: HDWallet
  asset: Asset
  validator: string

  constructor(args: ConstructorArgs) {
    this.url = args.url
    this.wallet = args.wallet
    this.asset = args.asset
    this.validator = args.validator
  }

  async stake(input: StakeActionInput): Promise<string> {
    throw new Error('Not implemented')
  }

  async unstake(input: StakeActionInput): Promise<string> {
    throw new Error('Not implemented')
  }

  async claim(input: StakeActionInput): Promise<string> {
    throw new Error('Not implemented')
  }

  async getInfo(address: string): Promise<StakingInfo> {
    const stakedTxInfo = await axios.get(
      `${this.url}/staking/delegators/${address}/delegations/${this.validator}`
    )
    const rewardsTxInfo = await axios.get(
      `${this.url} + /distribution/delegators/ + ${address}/rewards`
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
    const txResponse = await axios.get(`${this.url}/txs/?message.sender=${address}`)

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
