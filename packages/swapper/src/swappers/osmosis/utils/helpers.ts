import axios from "axios"
import { SwapError } from "../../../index"
import { find } from "lodash"
import { bn, bnOrZero } from "../../utils/bignumber"

export interface IsymbolDenomMapping {
    OSMO: string
    ATOM: string
    USDC: string
}

export const symbolDenomMapping = {
    OSMO: 'uosmo',
    ATOM: 'ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2',
    USDC: 'ibc/D189335C6E4A68B513C10AB227BF1C1D38C746766278BA3EEB4FB14124F1D858',
}

// TODO: pass in env variables
export const osmoUrl = 'https://lcd-osmosis.blockapsis.com'
export const atomUrl = 'https://cosmos-mainnet-rpc.allthatnode.com:1317'

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
  
      const poll = async function() {
        const status = await txStatus(txid, baseUrl)
        console.log('status', status)
        if (status === 'success') {
          resolve(status)
        } else if ((Date.now() - startTime) > timeout) {
          reject(new Error(`Couldnt find tx ${txid}`))
        } else {
          console.log('timeout')
          setTimeout(poll, interval)
        }
      }
      poll()
    })
}

const atomChannelBalance = async (address: string) => {
    const osmoResponseBalance = await axios.get(`${osmoUrl}/bank/balances/${address}`)
    let toAtomChannelBalance = 0
    try {
      const { amount } = find(
        osmoResponseBalance.data.result,
        (b) => b.denom === symbolDenomMapping.ATOM
      )
      toAtomChannelBalance = Number(amount)
    } catch(e) {
      console.log('no channel balance')
    }
    return toAtomChannelBalance
  }
  
export  const pollForAtomChannelBalance = async (address: string): Promise<number> => {
    console.log('pollForAtomChannelBalance')
    return new Promise((resolve, reject) => {
      const timeout = 120000 // 2 mins
      const startTime = Date.now()
      const interval = 5000 // 5 seconds
  
      const poll = async function() {
        const balance = await atomChannelBalance(address)
        if (balance > 0) {
          console.log('returning balane ', balance)
          resolve(balance)
        } else if ((Date.now() - startTime) > timeout) {
          reject(new Error(`Couldnt find channel balance for ${address}`))
        } else {
          setTimeout(poll, interval)
        }
      }
      poll()
    })
  }

export const getAtomChannelBalance = async (address: string) => {
    const osmoResponseBalance = await axios.get(`${osmoUrl}/bank/balances/${address}`)
    let toAtomChannelBalance = 0
    try {
        const { amount } = find(
            osmoResponseBalance.data.result,
            (b) => b.denom === symbolDenomMapping.ATOM
        )
        toAtomChannelBalance = Number(amount)
    } catch(e) {
        console.log('no channel balance')
    }
    return toAtomChannelBalance
}

const findPool = async (sellAssetSymbol: string, buyAssetSymbol: string) => {
    const sellAssetDenom = symbolDenomMapping[sellAssetSymbol as keyof IsymbolDenomMapping]
    const buyAssetDenom = symbolDenomMapping[buyAssetSymbol as keyof IsymbolDenomMapping]

    const poolsUrl =
        osmoUrl+'/osmosis/gamm/v1beta1/pools?pagination.limit=1000'

    const poolsResponse = (await axios.get(poolsUrl))
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

    if (foundPool.poolAssets[0].token.denom === sellAssetDenom) { sellAssetIndex = 0, buyAssetIndex = 1 }
    else { sellAssetIndex = 1, buyAssetIndex = 0 }

    return { pool: foundPool, sellAssetIndex, buyAssetIndex }
}

export const getRateInfo = async (sellAsset: any, buyAsset: any, sellAmount: string) => {
    const { pool, sellAssetIndex, buyAssetIndex } = await findPool(sellAsset, buyAsset)
    console.log("******* pool: ", { pool, sellAssetIndex, buyAssetIndex })
    return getInfoFromPool(sellAmount, pool, sellAssetIndex, buyAssetIndex)
}

const getInfoFromPool = (sellAmount: string, pool: any, sellAssetIndex: number, buyAssetIndex: number) => {
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
    console.log('buyAmount', buyAmount.toString())
    const rate = bnOrZero(buyAmount).dividedBy(sellAmount)

    const priceImpact = bn(1).minus(initialMarketPrice.dividedBy(finalMarketPrice)).abs()
    return {
        rate: rate.toString(),
        priceImpact: priceImpact.toString(),
        tradeFee: pool.poolParams.swapFee,
        buyAmount: buyAmount.toString()
    }
}