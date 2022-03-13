import toLower from 'lodash/toLower'

const CAIP19ToGemTickerMap = {
  'bip122:000000000019d6689c085ae165831e93/slip44:0': 'BTC',
  'eip155:1/slip44:60': 'ETH',
  'eip155:1/erc20:0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9': 'AAVE',
  'eip155:1/erc20:0x0d8775f648430679a709e98d2b0cb6250d2887ef': 'BAT',
  'eip155:1/erc20:0x4fabb145d64652a948d72533023f6e7a623c7c53': 'BUSD',
  'eip155:1/erc20:0xc00e94cb662c3520282e6f5717214004a7f26888': 'COMP',
  'eip155:1/erc20:0xd533a949740bb3306d119cc777fa900ba034cd52': 'CRV',
  'eip155:1/erc20:0x6b175474e89094c44da98b954eedeac495271d0f': 'DAI',
  'erc20:0x056fd409e1d7a124bd7017459dfea2f387b6d5cd': 'GUSD',
  'eip155:1/erc20:0x514910771af9ca656af840dff83e8264ecf986ca': 'LINK',
  'eip155:1/erc20:0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2': 'MKR',
  'eip155:1/erc20:0x75231f58b43240c9718dd58b4967c5114342a86c': 'OKB',
  'eip155:1/erc20:0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f': 'SNX',
  'eip155:1/erc20:0xa4bdb11dc0a2bec88d24a3aa1e6bb17201112ebe': 'USDS',
  'eip155:1/erc20:0xdac17f958d2ee523a2206206994597c13d831ec7': 'USDT',
  'eip155:1/erc20:0x04fa0d235c4abf4bcf4787af4cf447de572ef828': 'UMA',
  'eip155:1/erc20:0x1f9840a85d5af5bf1d1762f925bdaddc4201f984': 'UNI',
  'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': 'USDC',
  'eip155:1/erc20:0x2260fac5e5542a773aa44fbcfedf7c193bc2c599': 'WBTC',
  'eip155:1/erc20:0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': 'WETH',
  'eip155:1/erc20:0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e': 'YFI'
} as Record<string, string>

const invert = <T extends Record<string, string>>(data: T) =>
  Object.entries(data).reduce((acc, [k, v]) => ((acc[v] = k), acc), {} as Record<string, string>)

const gemTickerToCAIP19Map: Record<string, string> = invert(CAIP19ToGemTickerMap)

export const gemTickerToCAIP19 = (id: string): string | undefined => gemTickerToCAIP19Map[id]

export const CAIP19ToGemTicker = (caip19: string): string | undefined =>
  CAIP19ToGemTickerMap[toLower(caip19)]
