import axios from "axios"
import { SwapError } from "../../../index"
import { bn, bnOrZero } from "../../zrx/utils/bignumber"
import { find } from "lodash"

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
export const atomUrl = 'https://cosmoshub.stakesystems.io'

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

    const rate = bnOrZero(buyAmount).dividedBy(sellAmount)

    const priceImpact = bn(1).minus(initialMarketPrice.dividedBy(finalMarketPrice)).abs()
    return {
        rate: rate.toString(),
        priceImpact: priceImpact.toString(),
        tradeFee: pool.poolParams.swapFee,
        buyAmount: buyAmount.toString()
    }
}