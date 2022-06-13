import axios from 'axios'
import toLower from 'lodash/toLower'

import { AssetId } from '../../index'

/** Helper module to generate the coinbase supported assets map in the sibling index file */
type CoinbaseCurrency = {
  id: string
  name: string
  min_size: string
  status: string
  message: string
  max_precision: string
  convertible_to: string[]
  details: {
    type: 'fiat' | 'crypto'
    symbol: string | null
    network_confirmations: number | null
    sort_order: number
    crypto_address_link: string | null
    crypto_transaction_link: string | null
    push_payment_methods: string[]
    group_types: string[]
    display_name: string | null
    processing_time_seconds: string | null
    min_withdrawal_amount: number | null
    max_withdrawal_amount: number | null
  }
  default_network: string
  supported_networks: string[]
}

function coinbaseCurrencyToAssetId(currency: CoinbaseCurrency): AssetId | null {
  if (currency.id === 'BTC') return 'bip122:000000000019d6689c085ae165831e93/slip44:0'
  if (currency.id === 'ATOM') return 'cosmos:cosmoshub-4/slip44:118'
  if (currency.id === 'OSMO') return 'cosmos:osmosis-1/slip44:118'
  if (currency.id === 'ETH') return 'eip155:1/slip44:60'
  if (currency.default_network === 'ethereum') {
    const addressQuery = currency.details.crypto_address_link?.split('token/')[1]
    const address = addressQuery?.split('?a')[0]
    return `eip155:1/erc20:${toLower(address)}`
  }
  console.info(`Could not create assetId from coinbase asset ${currency.id}`)
  return null
}

function getCoinbaseMap(data: CoinbaseCurrency[]): Record<AssetId, string> {
  return data.reduce<Record<AssetId, string>>(
    (acc: Record<AssetId, string>, current: CoinbaseCurrency) => {
      const assetId = coinbaseCurrencyToAssetId(current)
      if (!assetId) return acc
      acc[assetId] = current.id
      return acc
    },
    {}
  )
}

export async function getCoinbasePayAssets(): Promise<Record<AssetId, string>> {
  try {
    const { data } = await axios.get<CoinbaseCurrency[]>('https://api.pro.coinbase.com/currencies')
    return getCoinbaseMap(data)
  } catch (err) {
    console.error('Get supported coins (coinbase-pay) failed')
    return {}
  }
}
