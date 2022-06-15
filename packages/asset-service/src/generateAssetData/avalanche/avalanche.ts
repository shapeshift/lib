import {
  avalancheAssetId,
  avalancheChainId,
  CHAIN_NAMESPACE,
  CHAIN_REFERENCE,
  toAssetId
} from '@shapeshiftoss/caip'
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

// key is regular symbol, e.g. USDC
type AvalancheTokenList = Record<string, AvalancheToken>

// key is dot-e symbol, value is avalanche contract address
type AvalancheContractAddress = Record<string, string>

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

  const chainId = avalancheChainId
  const explorer = 'https://snowtrace.io/'
  const explorerAddressLink = `${explorer}address`
  const explorerTxLink = `${explorer}tx`

  const assets = Object.entries(tokenList).reduce<Asset[]>((acc, [symbol, v]) => {
    const assetReference = contractAddresses[`${symbol}.e`].toLowerCase()
    const assetNamespace = 'erc20'
    acc.push({
      chainId,
      assetId: toAssetId({ chainNamespace, chainReference, assetNamespace, assetReference }),
      name: `${symbol} on Avalanche`,
      symbol: `${symbol}.e`,
      precision: v.denomination,
      icon: v.logo,
      color: '#FFFFFF', // this will get picked up by the color generation script,
      explorer,
      explorerAddressLink,
      explorerTxLink
    })
    return acc
  }, [])

  const avaxAsset: Asset = {
    chainId,
    assetId: avalancheAssetId,
    name: 'Avalanche',
    symbol: 'AVAX',
    precision: 18,
    color: '#FFFFFF', // this will get picked up by the color generation script,
    icon: 'https://rawcdn.githack.com/trustwallet/assets/32e51d582a890b3dd3135fe3ee7c20c2fd699a6d/blockchains/avalanchec/info/logo.png',
    explorer,
    explorerAddressLink,
    explorerTxLink
  }
  assets.push(avaxAsset)
  return assets
}
