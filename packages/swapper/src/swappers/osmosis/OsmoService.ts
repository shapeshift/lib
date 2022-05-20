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

const pollForAtomChannelBalance = async (address: string): Promise<number> => {
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

const pollForComplete = async (txid: string, baseUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const timeout = 120000 // 2 mins
        const startTime = Date.now()
        const interval = 5000 // 5 seconds

        const poll = async function() {
            const status = await txStatus(txid, baseUrl)
            if (status === 'success') {
                resolve(status)
            } else if ((Date.now() - startTime) > timeout) {
                reject(new Error(`Couldnt find tx ${txid}`))
            } else {
                setTimeout(poll, interval)
            }
        }
        poll()
    })
}

// Seperate so we can return early txid1 for better UX
// Callback that waits for tx1 to finish before creating tx2
export const osmoToAtomCallback = async (txid1: string, sellAddress: string, gas: string, buyAssetDenom: string, buyAddress: string, wallet: HDWallet, accountUrl: string, osmosisAdapter: any, osmoAddressNList: number[]): Promise<any | undefined> => {
    const pollResult = await pollForComplete(txid1, osmoUrl)
    if(pollResult !== 'success')
        throw new Error('first osmo -> atom tx failed')

    if(!sellAddress) throw new SwapError('no sell address')
    const toAtomChannelBalance = await pollForAtomChannelBalance(sellAddress)

    const atomResponseLatestBlock = await axios.get(`${atomUrl}/blocks/latest`)
    const atomLatestBlock = atomResponseLatestBlock.data.block.header.height

    const tx2 = {
        memo: '',
        fee: {
            amount: [
                {
                    amount: '0', // having a fee here causes error
                    denom: 'uosmo'
                }
            ],
            gas: gas.toString()
        },
        signatures: null,
        msg: [
            {
                type: 'cosmos-sdk/MsgTransfer',
                value: {
                    source_port: 'transfer',
                    source_channel: 'channel-0',
                    token: {
                        denom: buyAssetDenom,
                        amount: String(toAtomChannelBalance)
                    },
                    sender: sellAddress,
                    receiver: buyAddress,
                    timeout_height: {
                        revision_number: '4',
                        revision_height: String(Number(atomLatestBlock)+100)
                    }
                }
            }
        ]
    }

    const responseAccount2 = await axios.get(accountUrl)
    const accountNumber2 = responseAccount2.data.result.value.account_number
    const sequence2 = responseAccount2.data.result.value.sequence

    const signed2 = await osmosisAdapter.signTransaction(
        {
            symbol: 'OSMO',
            transaction: {
                tx: tx2,
                addressNList: osmoAddressNList,
                chain_id: 'osmosis-1',
                account_number: accountNumber2,
                sequence: sequence2
            }
        },
        (wallet as unknown) as OsmosisWallet
    )

    const broadcastTxInput2 = { tx: signed2, symbol: 'OSMO', amount: '0', network: 'OSMO' }

    const txid2 = await osmosisAdapter.broadcastTransaction(broadcastTxInput2)

    return { txid: txid2 }
}

export const atomToOsmoCallback = async (txid1: string, buyAddress: string, fee: string, gas: string, buyAssetDenom: string, sellAssetDenom: string, osmoAdapter: any, osmoAddressNList: number[], wallet: HDWallet) => {
    const pollResult = await pollForComplete(txid1, atomUrl)
    if(pollResult !== 'success')
        throw new Error('first atom -> osmo tx failed')

    if(!buyAddress) throw new SwapError('no sell address')
    const toOsmoChannelBalance = await pollForAtomChannelBalance(buyAddress)

    const tx2 = {
        memo: '',
        fee: {
            amount: [
                {
                    amount: fee,
                    denom: 'uosmo'
                }
            ],
            gas: gas.toString()
        },
        signatures: null,
        msg: [
            {
                type: 'osmosis/gamm/swap-exact-amount-in',
                value: {
                    sender: buyAddress,
                    routes: [
                        {
                            poolId: '1', // TODO should probably get this from the util pool call
                            tokenOutDenom: buyAssetDenom
                        }
                    ],
                    tokenIn: {
                        denom: sellAssetDenom,
                        amount: String(toOsmoChannelBalance)
                    },
                    tokenOutMinAmount: '1' // TODO slippage tolerance
                }
            }
        ]
    }

    const accountUrl = `${osmoUrl}/auth/accounts/${buyAddress}`
    const osmoResponseAccount = await axios.get(accountUrl)
    const osmoAccountNumber = osmoResponseAccount.data.result.value.account_number
    const osmoSequence = osmoResponseAccount.data.result.value.sequence

    const signed2 = await osmoAdapter.signTransaction(
        {
            symbol: 'OSMO',
            transaction: {
                tx: tx2,
                addressNList: osmoAddressNList,
                chain_id: 'osmosis-1',
                account_number: osmoAccountNumber,
                sequence: osmoSequence
            }
        },
        wallet as OsmosisWallet
    )

    const broadcastTxInput2 = { tx: signed2, symbol: 'OSMO', amount: '0', network: 'OSMO' }

    const txid2 = await osmoAdapter.broadcastTransaction(broadcastTxInput2)

    return { txid: txid2}
}
