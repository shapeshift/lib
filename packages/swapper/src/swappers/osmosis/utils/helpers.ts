import axios, { AxiosResponse } from "axios"
import { fromAssetId } from "packages/caip"
import { SwapError, SwapErrorTypes } from "@shapeshiftoss/swapper"
import { Asset } from "@shapeshiftoss/types"
import { bn, bnOrZero } from "../../zrx/utils/bignumber"
import { find } from "lodash"

export interface IsymbolDenomMapping {
    OSMO: string
    ATOM: string
}

export const symbolDenomMapping = {
    OSMO: 'uosmo',
    ATOM: 'ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2'
}

export const osmoUrl = process.env['OSMO_NODE']
export const atomUrl = process.env['ATOM_NODE']

export const getUsdRate = async (input: Pick<Asset, 'symbol' | 'assetId'>): Promise<string> => {
    const { symbol, assetId } = input

    const { assetReference: erc20Address, assetNamespace } = fromAssetId(assetId)

    try {
        const USDC_CONTRACT_ADDRESS = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
        if (erc20Address?.toLowerCase() === USDC_CONTRACT_ADDRESS) return '1' // Will break if comparing against usdc
        //   const rateResponse: AxiosResponse<ZrxPriceResponse> = await zrxService.get<ZrxPriceResponse>(
        //     '/swap/v1/price',
        //     {
        //       params: {
        //         buyToken: USDC_CONTRACT_ADDRESS,
        //         buyAmount: '1000000000', // rate is imprecise for low $ values, hence asking for $1000
        //         sellToken: assetNamespace === 'erc20' ? erc20Address : symbol
        //       }
        //     }
        //   )

        //   const price = bnOrZero(rateResponse.data.price)

        //   if (!price.gt(0))
        //     throw new SwapError('[getUsdRate] - Failed to get price data', {
        //       code: SwapErrorTypes.RESPONSE_ERROR
        //     })

        return '1' // bn(1).dividedBy(price).toString()
    } catch (e) {
        if (e instanceof SwapError) throw e
        throw new SwapError('[getUsdRate]', {
            cause: e,
            code: SwapErrorTypes.USD_RATE_FAILED
        })
    }
}

const findPool = async (sellAsset: any, buyAsset: any) => {
    const sellAssetDenom = symbolDenomMapping[sellAsset.symbol as keyof IsymbolDenomMapping]
    const buyAssetDenom = symbolDenomMapping[buyAsset.symbol as keyof IsymbolDenomMapping]

    const poolsUrl =
        osmoUrl+'osmosis/gamm/v1beta1/pools'

    console.log("poolsUrl: ",poolsUrl)
    const poolsResponse = (await axios.get(poolsUrl))
    // console.log("poolsResponse: ",poolsResponse)

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