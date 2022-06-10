import { CHAIN_NAMESPACE, CHAIN_REFERENCE, toAssetId } from '@shapeshiftoss/caip'
import { Asset } from '@shapeshiftoss/types'
import axios from 'axios'

type AvalancheToken = {
  nativeNetwork: string
  nativeContractAddress: string
  denomination: number // precision
  chainlinkFeedAddress: string
  logo: string
  coingeckoId: string
}
type AvalancheTokenList = { [k: string]: AvalancheToken }

type AvalancheContractAddress = {
  [symbolDotE: string]: string // value is avalanche contract address
}

type GetAvalancheAssets = () => Promise<Asset[]>

export const getAvalancheAssets: GetAvalancheAssets = async () => {
  // this file contains the eth side of tokens bridged to avalanche
  // see https://docs.penguinfinance.io/getting-started/new-.e-tokens-explainer for more info
  // https://github.com/ava-labs/avalanche-bridge-resources/blob/main/token_list.json
  const avalancheTokenListUrl =
    'https://rawcdn.githack.com/ava-labs/avalanche-bridge-resources/31fabeeeca69fa774be54c5b6ec93bea56161d6a/token_list.json'
  const { data: tokenList } = await axios.get<AvalancheTokenList>(avalancheTokenListUrl)

  // https://github.com/ava-labs/avalanche-bridge-resources/blob/main/avalanche_contract_address.json
  const avalancheContractAddressesUrl =
    'https://rawcdn.githack.com/ava-labs/avalanche-bridge-resources/31fabeeeca69fa774be54c5b6ec93bea56161d6a/avalanche_contract_address.json'
  const { data: contractAddresses } = await axios.get<AvalancheContractAddress>(
    avalancheContractAddressesUrl
  )

  const chainNamespace = CHAIN_NAMESPACE.Ethereum
  const chainReference = CHAIN_REFERENCE.AvalancheCChain

  // TODO(0xdef1cafe): toAssetId needs to support avalanche chain reference
  // const avaxAssetId = toAssetId({ chainNamespace, chainReference, slip44 })
  const chainId = `${chainNamespace}:${chainReference}`
  const explorer = 'https://snowtrace.io/'
  const explorerAddressLink = `${explorer}address`
  const explorerTxLink = `${explorer}tx`

  const assets = Object.entries(tokenList).reduce<Asset[]>((acc, [symbol, v]) => {
    const name = `${symbol} on Avalanche`
    const precision = v.denomination
    const icon = v.logo
    // TODO(0xdef1cafe): this will get picked up by the color generation script
    const color = '#FFFFFF'
    const assetReference = contractAddresses[`${symbol}.e`].toLowerCase()
    const assetNamespace = 'erc20'
    const assetId = toAssetId({ chainNamespace, chainReference, assetNamespace, assetReference })
    acc.push({
      chainId,
      assetId,
      name,
      symbol,
      precision,
      icon,
      color,
      explorer,
      explorerAddressLink,
      explorerTxLink
    })
    return acc
  }, [])

  const assetNamespace = 'slip44'
  const assetReference = '9000'
  const assetId = toAssetId({ chainNamespace, chainReference, assetNamespace, assetReference })
  const name = 'Avalanche'
  const symbol = 'AVAX'
  const precision = 18
  const color = '#FFFFFF' // this will get picked up by the color generation script
  const icon =
    'https://rawcdn.githack.com/trustwallet/assets/32e51d582a890b3dd3135fe3ee7c20c2fd699a6d/blockchains/avalanchec/info/logo.png'
  const avaxAsset: Asset = {
    chainId,
    assetId,
    name,
    symbol,
    precision,
    color,
    icon,
    explorer,
    explorerAddressLink,
    explorerTxLink
  }
  assets.push(avaxAsset)
  return assets
}
