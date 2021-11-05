export type YearnApiVault = {
  inception: number
  address: string
  symbol: string
  name: string
  display_name: string
  icon: string
  token: {
    name: string
    symbol: string
    address: string
    decimals: number
    display_name: string
    icon: string
  }
  tvl: {
    total_assets: number
    price: number
    tvl: number
  }
  apy: {
    net_apy: number
  }
  endorsed: boolean
  version: string
  decimals: number
  type: string
  emergency_shutdown: boolean
}
