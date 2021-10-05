export const UNISWAP_ROUTER_ADDRESS = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'
export const UNISWAP_FACTORY_ADDRESS = '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f'
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
export const FOX_TOKEN_CONTRACT_ADDRESS = '0xc770EEfAd204B5180dF6a14Ee197D99d808ee52d'
export const WETH_TOKEN_CONTRACT_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
export const UNISWAP_WETH_FOX_POOL_ADDRESS = '0x470e8de2ebaef52014a47cb5e6af86884947f08c'
export const MAX_ALLOWANCE = '100000000000000000000000000'
export const APPROVAL_GAS_LIMIT = '100000' // Most approvals are around 40k, we've seen 72k in the wild, so 100000 for safety.
export const LIQUIDITY_GAS_LIMIT = '350000' // Most Liquidity txs are around 150000
export const MAX_GAS_PRICE = '1000000000000' // 1000 GWei
export const MAX_ZRX_TRADE = '100000000000000000000000000'
export const DEFAULT_SOURCE = [{ name: '0x', proportion: '1' }]
export const DEFAULT_SLIPPAGE = '3.0' // 3%
export const MAX_SLIPPAGE = '30.0' // 30%
export const DEFAULT_ETH_PATH = `m/44'/60'/0'/0/0` // TODO: remove when `adapter.getAddress` changes to take an account instead of default path
export const AFFILIATE_ADDRESS = '0xc770eefad204b5180df6a14ee197d99d808ee52d'
export const APPROVAL_BUY_AMOUNT = '100000000000000000' // A valid buy amount - 0.1 ETH
