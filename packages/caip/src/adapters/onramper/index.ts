import entries from 'lodash/entries'
import invert from 'lodash/invert'

import { avalancheAssetId, btcAssetId, cosmosAssetId, ethAssetId } from '../../constants'
import { AssetId } from './../../assetId/assetId'

const AssetIdToTransakTickerMap = {
  [btcAssetId]: 'btc',
  [cosmosAssetId]: 'atom',
  [ethAssetId]: 'eth',
  [avalancheAssetId]: 'avax',
  'eip155:1/erc20:0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9': 'AAVE_ECR20',
  'eip155:1/erc20:0x4fabb145d64652a948d72533023f6e7a623c7c53': 'BUSD',
  'eip155:1/erc20:0xc00e94cb662c3520282e6f5717214004a7f26888': 'COMP',
  'eip155:1/erc20:0x6b175474e89094c44da98b954eedeac495271d0f': 'DAI_ERC20',
  'eip155:1/erc20:0xf629cbd94d3791c9250152bd8dfbdf380e2a3b9c': 'ENJ',
  'eip155:1/erc20:0x514910771af9ca656af840dff83e8264ecf986ca': 'LINK',
  'eip155:1/erc20:0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2': 'MKR',
  'eip155:1/erc20:0x0f5d2fb29fb7d3cfee444a200298f468908cc942': 'MANA_ERC20',
  'eip155:1/erc20:0x6b3595068778dd592e39a122f4f5a5cf09c90fe2': 'SUSHI_ERC20',
  'eip155:1/erc20:0x1f9840a85d5af5bf1d1762f925bdaddc4201f984': 'UNI-ERC20',
  'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': 'USDC',
  'eip155:1/erc20:0xdac17f958d2ee523a2206206994597c13d831ec7': 'USDT',
} as Record<AssetId, string>

// define and join more providers if needed
const fullOnRamperAssetIdMap = AssetIdToTransakTickerMap

const onRamperTickerToAssetIdMap = invert(fullOnRamperAssetIdMap)

export const getSupportedOnRamperAssets = () =>
  entries(fullOnRamperAssetIdMap).map(([assetId, ticker]) => ({
    assetId,
    ticker,
  }))

export const onRamperTickerToAssetId = (id: string): string | undefined =>
  onRamperTickerToAssetIdMap[id.toLowerCase()]

export const assetIdToOnRamperTicker = (assetId: string): string =>
fullOnRamperAssetIdMap[assetId].toUpperCase()