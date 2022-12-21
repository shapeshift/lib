type OsmosisToken = {
  denom: string
  amount: string
}

type OsmosisPoolAsset = {
  token: OsmosisToken
  weight: string
}

export interface OsmosisPool {
  '@type': string
  address: string
  id: string
  pool_params: {
    swap_fee: string
    exit_fee: string
    smooth_weight_change_params: boolean
  }
  future_pool_governor: string
  total_shares: {
    denom: string
    amount: string
  }
  pool_assets: OsmosisPoolAsset[]
  total_weight: string
  apr: number
}

export const baseUrl = 'https://lcd-osmosis.keplr.app/osmosis/'

export const osmosisImperatorBaseUrl = 'https://api-osmosis.imperator.co/'
