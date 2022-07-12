import { cosmos, osmosis } from '@shapeshiftoss/chain-adapters'
import { bip32ToAddressNList, HDWallet } from '@shapeshiftoss/hdwallet-core'
import axios from 'axios'
import { find } from 'lodash'

import { SwapError, TradeResult } from '../../../index'
import { bn, bnOrZero } from '../../utils/bignumber'
import { GAS } from './constants'
import { IbcTransferInput, PoolInfo } from './types'

export interface IsymbolDenomMapping {
  OSMO: string
  ATOM: string
  USDC: string
}

export const symbolDenomMapping = {
  OSMO: 'uosmo',
  ATOM: 'ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2',
  USDC: 'ibc/D189335C6E4A68B513C10AB227BF1C1D38C746766278BA3EEB4FB14124F1D858'
}

const txStatus = async (txid: string, baseUrl: string): Promise<string> => {
  try {
    const txResponse = await axios.get(`${baseUrl}/txs/${txid}`)
    if (!txResponse?.data?.codespace && !!txResponse?.data?.gas_used) return 'success'
    if (txResponse?.data?.codespace) return 'failed'
    // eslint-disable-next-line no-empty
  } catch (e) {}
  return 'not found'
}

export const pollForComplete = async (txid: string, baseUrl: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const timeout = 120000 // 2 mins
    const startTime = Date.now()
    const interval = 5000 // 5 seconds

    const poll = async function () {
      const status = await txStatus(txid, baseUrl)
      if (status === 'success') {
        resolve(status)
      } else if (Date.now() - startTime > timeout) {
        reject(new Error(`Couldnt find tx ${txid}`))
      } else {
        setTimeout(poll, interval)
      }
    }
    poll()
  })
}

export const getAtomChannelBalance = async (address: string, osmoUrl: string) => {
  const osmoResponseBalance = await axios.get(`${osmoUrl}/bank/balances/${address}`)
  let toAtomChannelBalance = 0
  try {
    const { amount } = find(
      osmoResponseBalance.data.result,
      (b) => b.denom === symbolDenomMapping.ATOM
    )
    toAtomChannelBalance = Number(amount)
  } catch (e) {
    console.error('no channel balance')
  }
  return toAtomChannelBalance
}

export const pollForAtomChannelBalance = async (
  address: string,
  osmoUrl: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const timeout = 120000 // 2 mins
    const startTime = Date.now()
    const interval = 5000 // 5 seconds

    const poll = async function () {
      const balance = await getAtomChannelBalance(address, osmoUrl)
      if (balance > 0) {
        resolve(balance.toString())
      } else if (Date.now() - startTime > timeout) {
        reject(new Error(`Couldnt find channel balance for ${address}`))
      } else {
        setTimeout(poll, interval)
      }
    }
    poll()
  })
}

const findPool = async (sellAssetSymbol: string, buyAssetSymbol: string, osmoUrl: string) => {
  const sellAssetDenom = symbolDenomMapping[sellAssetSymbol as keyof IsymbolDenomMapping]
  const buyAssetDenom = symbolDenomMapping[buyAssetSymbol as keyof IsymbolDenomMapping]

  const poolsUrl = osmoUrl + '/osmosis/gamm/v1beta1/pools?pagination.limit=1000'

  const poolsResponse = await axios.get(poolsUrl)
  const foundPool = find(poolsResponse.data.pools, (pool) => {
    const token0Denom = pool.poolAssets[0].token.denom
    const token1Denom = pool.poolAssets[1].token.denom
    return (
      (token0Denom === sellAssetDenom && token1Denom === buyAssetDenom) ||
      (token0Denom === buyAssetDenom && token1Denom === sellAssetDenom)
    )
  })

  if (!foundPool) throw new SwapError('Couldnt find pool')

  let sellAssetIndex
  let buyAssetIndex

  if (foundPool.poolAssets[0].token.denom === sellAssetDenom) {
    ;(sellAssetIndex = 0), (buyAssetIndex = 1)
  } else {
    ;(sellAssetIndex = 1), (buyAssetIndex = 0)
  }

  return { pool: foundPool, sellAssetIndex, buyAssetIndex }
}

const getInfoFromPool = (
  sellAmount: string,
  pool: PoolInfo,
  sellAssetIndex: number,
  buyAssetIndex: number
) => {
  const constantProduct = bnOrZero(pool.poolAssets[0].token.amount).times(
    pool.poolAssets[1].token.amount
  )
  const sellAssetInitialPoolSize = bnOrZero(pool.poolAssets[sellAssetIndex].token.amount)
  const buyAssetInitialPoolSize = bnOrZero(pool.poolAssets[buyAssetIndex].token.amount)

  const initialMarketPrice = sellAssetInitialPoolSize.dividedBy(buyAssetInitialPoolSize)
  const sellAssetFinalPoolSize = sellAssetInitialPoolSize.plus(sellAmount)
  const buyAssetFinalPoolSize = constantProduct.dividedBy(sellAssetFinalPoolSize)
  const finalMarketPrice = sellAssetFinalPoolSize.dividedBy(buyAssetFinalPoolSize)
  const buyAmount = buyAssetInitialPoolSize.minus(buyAssetFinalPoolSize)
  const rate = bnOrZero(buyAmount).dividedBy(sellAmount)

  const priceImpact = bn(1).minus(initialMarketPrice.dividedBy(finalMarketPrice)).abs()
  return {
    rate: rate.toString(),
    priceImpact: priceImpact.toString(),
    tradeFee: pool.poolParams.swapFee,
    buyAmount: buyAmount.toString()
  }
}

export const getRateInfo = async (
  sellAsset: string,
  buyAsset: string,
  sellAmount: string,
  osmoUrl: string
) => {
  const { pool, sellAssetIndex, buyAssetIndex } = await findPool(sellAsset, buyAsset, osmoUrl)
  return getInfoFromPool(sellAmount, pool, sellAssetIndex, buyAssetIndex)
}

export const performIbcTransfer = async (
  input: IbcTransferInput,
  adapter: cosmos.ChainAdapter | osmosis.ChainAdapter,
  wallet: HDWallet,
  accountBaseUrl: string,
  blockBaseUrl: string,
  denom: string,
  sourceChannel: string,
  feeAmount: string
): Promise<TradeResult> => {
  const { sender, receiver, amount } = input

  const responseLatestBlock = await axios.get(`${blockBaseUrl}/blocks/latest`)
  const latestBlock = responseLatestBlock.data.block.header.height

  const addressNList = bip32ToAddressNList("m/44'/118'/0'/0/0")

  const accountUrl = `${accountBaseUrl}/auth/accounts/${sender}`
  const responseAccount = await axios.get(accountUrl)
  const accountNumber = responseAccount.data.result.value.account_number
  const sequence = responseAccount.data.result.value.sequence

  if (!accountNumber) throw new Error('no atom account number')

  const tx1 = {
    memo: '',
    fee: {
      amount: [
        {
          amount: feeAmount.toString(), // having a fee here causes error
          denom: 'uosmo'
        }
      ],
      gas: GAS
    },
    signatures: null,
    msg: [
      {
        type: 'cosmos-sdk/MsgTransfer',
        value: {
          source_port: 'transfer',
          source_channel: sourceChannel,
          token: {
            denom,
            amount
          },
          sender,
          receiver,
          timeout_height: {
            revision_number: '4',
            revision_height: String(Number(latestBlock) + 100)
          }
        }
      }
    ]
  }

  const signed = await adapter.signTransaction({
    txToSign: {
      tx: tx1,
      addressNList,
      chain_id: 'osmosis-1',
      account_number: accountNumber,
      sequence
    },
    wallet
  })
  const tradeId = await adapter.broadcastTransaction(signed)

  return {
    tradeId
  }
}
