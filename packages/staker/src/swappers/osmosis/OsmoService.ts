/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prettier/prettier */
/* eslint-disable no-console */
import { HDWallet, OsmosisWallet } from '@shapeshiftoss/hdwallet-core'
import axios from 'axios'
import BigNumber from 'bignumber.js'
import { find } from 'lodash'

import { SwapError } from '../../api'
// import { OsmosisChainAdapter } from '@shapeshiftoss/platform.chain-adapters'
// import { ChainAdapterManager } from '@shapeshiftoss/chain-adapters'

// eslint-disable-next-line @typescript-eslint/no-var-requires
require("dotenv").config({path:'.env'})

export interface IsymbolDenomMapping {
    OSMO: string
    ATOM: string
}
// We find the right pool using asset denom
// needs more work before can support more than osmo + 1 asset
export const symbolDenomMapping = {
    OSMO: 'uosmo',
    ATOM: 'ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2'
}

export const osmoUrl = process.env['OSMO_NODE']
export const atomUrl = process.env['ATOM_NODE']
if(!osmoUrl) throw Error("OSMO_NODE required!")
if(!atomUrl) throw Error("ATOM_NODE required!")

const findPool = async (sellAsset: any, buyAsset: any) => {
    const sellAssetDenom = symbolDenomMapping[sellAsset.symbol as keyof IsymbolDenomMapping]
    const buyAssetDenom = symbolDenomMapping[buyAsset.symbol as keyof IsymbolDenomMapping]

    const poolsUrl =
        osmoUrl+'osmosis/gamm/v1beta1/pools'

    console.log("poolsUrl: ",poolsUrl)
    const poolsResponse = (await axios.get(poolsUrl))
    console.log("poolsResponse: ",poolsResponse)

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

const getInfoFromPool = (sellAmount: string, pool: any, sellAssetIndex: number, buyAssetIndex: number) => {
    const constantProduct = new BigNumber(pool.poolAssets[0].token.amount).times(
        pool.poolAssets[1].token.amount
    )
    const sellAssetInitialPoolSize = new BigNumber(pool.poolAssets[sellAssetIndex].token.amount)
    const buyAssetInitialPoolSize = new BigNumber(pool.poolAssets[buyAssetIndex].token.amount)

    const initialMarketPrice = sellAssetInitialPoolSize.dividedBy(buyAssetInitialPoolSize)

    const sellAssetFinalPoolSize = sellAssetInitialPoolSize.plus(sellAmount)

    const buyAssetFinalPoolSize = constantProduct.dividedBy(sellAssetFinalPoolSize)

    const finalMarketPrice = sellAssetFinalPoolSize.dividedBy(buyAssetFinalPoolSize)

    const buyAmount = buyAssetInitialPoolSize.minus(buyAssetFinalPoolSize)

    const rate = new BigNumber(buyAmount).dividedBy(sellAmount)

    const priceImpact = new BigNumber(1).minus(initialMarketPrice.dividedBy(finalMarketPrice)).abs()
    return {
        rate: rate.toString(),
        priceImpact: priceImpact.toString(),
        tradeFee: pool.poolParams.swapFee,
        buyAmount: buyAmount.toString()
    }
}

export const getRateInfo = async (sellAsset: any, buyAsset: any, sellAmount: string) => {
    const { pool, sellAssetIndex, buyAssetIndex } = await findPool(sellAsset, buyAsset)
    console.log("******* pool: ",{ pool, sellAssetIndex, buyAssetIndex })
    return getInfoFromPool(sellAmount, pool, sellAssetIndex, buyAssetIndex)
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
