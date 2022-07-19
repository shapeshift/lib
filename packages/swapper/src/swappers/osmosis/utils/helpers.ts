import { CHAIN_REFERENCE, ChainId } from '@shapeshiftoss/caip'
import { osmosis, toPath } from '@shapeshiftoss/chain-adapters'
import { bip32ToAddressNList, HDWallet } from '@shapeshiftoss/hdwallet-core'
import axios from 'axios'
import { find } from 'lodash'

import {
  CosmosSdkSupportedChainAdapters,
  SwapError,
  SwapErrorTypes,
  Trade,
  TradeResult
} from '../../../index'
import { bn, bnOrZero } from '../../utils/bignumber'
import { OSMOSIS_PRECISION } from './constants'
import { IbcTransferInput, PoolInfo } from './types'

export interface SymbolDenomMapping {
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
  } catch (e) {
    console.error('Failed to get status')
  }
  return 'not found'
}

// TODO: leverage chain-adapters websockets
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
        reject(
          new SwapError(`Couldnt find tx ${txid}`, {
            code: SwapErrorTypes.RESPONSE_ERROR
          })
        )
      } else {
        setTimeout(poll, interval)
      }
    }
    poll()
  })
}

export const getAtomChannelBalance = async (address: string, osmoUrl: string) => {
  const osmoResponseBalance = await (async () => {
    try {
      return axios.get(`${osmoUrl}/bank/balances/${address}`)
    } catch (e) {
      throw new SwapError('failed to get balance', {
        code: SwapErrorTypes.RESPONSE_ERROR
      })
    }
  })()
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
        reject(
          new SwapError(`Couldnt find channel balance for ${address}`, {
            code: SwapErrorTypes.RESPONSE_ERROR
          })
        )
      } else {
        setTimeout(poll, interval)
      }
    }
    poll()
  })
}

const findPool = async (sellAssetSymbol: string, buyAssetSymbol: string, osmoUrl: string) => {
  const sellAssetDenom = symbolDenomMapping[sellAssetSymbol as keyof SymbolDenomMapping]
  const buyAssetDenom = symbolDenomMapping[buyAssetSymbol as keyof SymbolDenomMapping]

  const poolsUrl = osmoUrl + '/osmosis/gamm/v1beta1/pools?pagination.limit=1000'

  const poolsResponse = await (async () => {
    try {
      return axios.get(poolsUrl)
    } catch (e) {
      throw new SwapError('failed to get pool', {
        code: SwapErrorTypes.POOL_NOT_FOUND
      })
    }
  })()
  const foundPool = find(poolsResponse.data.pools, (pool) => {
    const token0Denom = pool.poolAssets[0].token.denom
    const token1Denom = pool.poolAssets[1].token.denom
    return (
      (token0Denom === sellAssetDenom && token1Denom === buyAssetDenom) ||
      (token0Denom === buyAssetDenom && token1Denom === sellAssetDenom)
    )
  })

  if (!foundPool)
    throw new SwapError('could not find pool', {
      code: SwapErrorTypes.POOL_NOT_FOUND
    })

  const { sellAssetIndex, buyAssetIndex } = (() => {
    if (foundPool.poolAssets[0].token.denom === sellAssetDenom) {
      return { sellAssetIndex: 0, buyAssetIndex: 1 }
    } else {
      return { sellAssetIndex: 1, buyAssetIndex: 0 }
    }
  })()

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
  const buyAmount = buyAssetInitialPoolSize.minus(buyAssetFinalPoolSize).toString()
  const rate = bnOrZero(buyAmount).dividedBy(sellAmount).toString()
  const priceImpact = bn(1).minus(initialMarketPrice.dividedBy(finalMarketPrice)).abs().toString()
  const tradeFeeBase = bnOrZero(buyAmount).times(bnOrZero(pool.poolParams.swapFee))
  const tradeFee = tradeFeeBase.dividedBy(bn(10).exponentiatedBy(OSMOSIS_PRECISION)).toString()

  return {
    rate,
    priceImpact,
    tradeFee,
    buyAmount
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

// TODO: move to chain adapters
export const performIbcTransfer = async (
  input: IbcTransferInput,
  adapter: CosmosSdkSupportedChainAdapters,
  wallet: HDWallet,
  blockBaseUrl: string,
  denom: string,
  sourceChannel: string,
  feeAmount: string,
  accountNumber: string,
  sequence: string,
  gas: string
): Promise<TradeResult> => {
  const { sender, receiver, amount } = input

  const responseLatestBlock = await (async () => {
    try {
      return axios.get(`${blockBaseUrl}/blocks/latest`)
    } catch (e) {
      throw new SwapError('failed to get latest block', {
        code: SwapErrorTypes.RESPONSE_ERROR
      })
    }
  })()
  const latestBlock = responseLatestBlock.data.block.header.height
  const bip44Params = adapter.buildBIP44Params({
    accountNumber: 0 // TODO: Use real accountNumbers
  })
  const path = toPath(bip44Params)
  const addressNList = bip32ToAddressNList(path)

  const tx1 = {
    memo: '',
    fee: {
      amount: [
        {
          amount: feeAmount.toString(),
          denom: 'uosmo'
        }
      ],
      gas
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
      chain_id: CHAIN_REFERENCE.OsmosisMainnet,
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

// TODO: move to chain adapters
export const buildTradeTx = async ({
  osmoAddress,
  adapter,
  trade,
  buyAssetDenom,
  sellAssetDenom,
  sellAmount,
  gas,
  wallet
}: {
  osmoAddress: string
  adapter: osmosis.ChainAdapter
  trade: Trade<ChainId>
  buyAssetDenom: string
  sellAssetDenom: string
  sellAmount: string
  gas: string
  wallet: HDWallet
}) => {
  const responseAccount = await adapter.getAccount(osmoAddress)

  const accountNumber = responseAccount.chainSpecific.accountNumber || '0'
  const sequence = responseAccount.chainSpecific.sequence || '0'

  const bip44Params = adapter.buildBIP44Params({
    accountNumber: 0 // TODO: Use real accountNumbers
  })
  const path = toPath(bip44Params)
  const osmoAddressNList = bip32ToAddressNList(path)

  const tx = {
    memo: '',
    fee: {
      amount: [
        {
          amount: trade.feeData.fee.toString(),
          denom: 'uosmo'
        }
      ],
      gas
    },
    signatures: null,
    msg: [
      {
        type: 'osmosis/gamm/swap-exact-amount-in',
        value: {
          sender: osmoAddress,
          routes: [
            {
              poolId: '1', // TODO: should probably get this from the util pool call
              tokenOutDenom: buyAssetDenom
            }
          ],
          tokenIn: {
            denom: sellAssetDenom,
            amount: sellAmount
          },
          tokenOutMinAmount: '1' // slippage tolerance
        }
      }
    ]
  }

  return {
    txToSign: {
      tx,
      addressNList: osmoAddressNList,
      chain_id: CHAIN_REFERENCE.OsmosisMainnet,
      account_number: accountNumber,
      sequence
    },
    wallet
  }
}
