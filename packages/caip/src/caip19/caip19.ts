// https://github.com/ChainAgnostic/CAIPs/blob/master/CAIPs/caip-19.md\
import { CAIP2, isCAIP2, WellKnownChain } from '../caip2/caip2'

export type CAIP19 = string

export enum AssetNamespace {
  CW20 = 'cw20',
  CW721 = 'cw721',
  ERC20 = 'erc20',
  ERC721 = 'erc721',
  Slip44 = 'slip44',
  NATIVE = 'native',
  IBC = 'ibc'
}

export const WellKnownAsset = Object.freeze({
  ETH: 'eip155:1/slip44:60',
  ETHRopsten: 'eip155:3/slip44:60',
  ETHRinkeby: 'eip155:4/slip44:60',
  ETHKovan: 'eip155:42/slip44:60',
  USDC: 'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  WETH: 'eip155:1/erc20:0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  BTC: 'bip122:000000000019d6689c085ae165831e93/slip44:0',
  BTCTestnet: 'bip122:000000000933ea01ad0ee984209779ba/slip44:1',
  ATOM: 'cosmos:cosmoshub-4/slip44:118',
  ATOMVega: 'cosmos:vega-testnet/slip44:118',
  OSMO: 'cosmos:osmosis-1/slip44:118',
  OSMOTestnet: 'cosmos:osmo-testnet-1/slip44:118'
} as const)
export type WellKnownAsset = typeof WellKnownAsset[keyof typeof WellKnownAsset]

type ToCAIP19Args = {
  chainId: CAIP2
  assetNamespace: AssetNamespace
  assetReference: string
}

const validAssetNamespaces: Record<WellKnownChain, Set<AssetNamespace>> = Object.freeze({
  [WellKnownChain.BitcoinMainnet]: new Set([AssetNamespace.Slip44]),
  [WellKnownChain.BitcoinTestnet]: new Set([AssetNamespace.Slip44]),
  [WellKnownChain.EthereumMainnet]: new Set([
    AssetNamespace.Slip44,
    AssetNamespace.ERC20,
    AssetNamespace.ERC721
  ]),
  [WellKnownChain.EthereumRopsten]: new Set([
    AssetNamespace.Slip44,
    AssetNamespace.ERC20,
    AssetNamespace.ERC721
  ]),
  [WellKnownChain.EthereumRinkeby]: new Set([
    AssetNamespace.Slip44,
    AssetNamespace.ERC20,
    AssetNamespace.ERC721
  ]),
  [WellKnownChain.EthereumKovan]: new Set([
    AssetNamespace.Slip44,
    AssetNamespace.ERC20,
    AssetNamespace.ERC721
  ]),
  [WellKnownChain.CosmosHubMainnet]: new Set([
    AssetNamespace.CW20,
    AssetNamespace.CW721,
    AssetNamespace.IBC,
    AssetNamespace.NATIVE,
    AssetNamespace.Slip44
  ]),
  [WellKnownChain.CosmosHubVega]: new Set([
    AssetNamespace.CW20,
    AssetNamespace.CW721,
    AssetNamespace.IBC,
    AssetNamespace.NATIVE,
    AssetNamespace.Slip44
  ]),
  [WellKnownChain.OsmosisMainnet]: new Set([
    AssetNamespace.CW20,
    AssetNamespace.CW721,
    AssetNamespace.IBC,
    AssetNamespace.NATIVE,
    AssetNamespace.Slip44
  ]),
  [WellKnownChain.OsmosisTestnet]: new Set([
    AssetNamespace.CW20,
    AssetNamespace.CW721,
    AssetNamespace.IBC,
    AssetNamespace.NATIVE,
    AssetNamespace.Slip44
  ])
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function stringToEnum<T>(obj: any, item: string): T | undefined {
  const found = Object.entries(obj).find((i) => i.includes(item))?.[0]
  return found ? obj[found as keyof T] : undefined
}

/**
 * validate that a value is a string slip44 value
 * @see https://github.com/satoshilabs/slips/blob/master/slip-0044.md
 * @param {string} value - possible slip44 value
 */
const isValidSlip44 = (value: string) => {
  const n = Number(value)
  // slip44 has a max value of an unsigned 32-bit integer
  return !isNaN(n) && n >= 0 && n < 4294967296
}

type ToCAIP19 = (args: ToCAIP19Args) => string

export const toCAIP19: ToCAIP19 = (args: ToCAIP19Args): string => {
  const { chainId, assetNamespace } = args
  let { assetReference } = args
  if (!chainId) throw new Error('toCAIP19: No chainId provided')
  if (!isCAIP2(chainId)) throw new Error('toCAIP19: Unrecognized chainId provided')
  if (!assetNamespace) throw new Error('toCAIP19: No assetNamespace provided')
  if (!assetReference) throw new Error('toCAIP19: No assetReference provided')

  if (!validAssetNamespaces[chainId].has(assetNamespace)) {
    throw new Error(
      `toCAIP19: Asset Namespace ${assetNamespace} not supported for chainId ${chainId}`
    )
  }

  if (assetNamespace === AssetNamespace.Slip44 && !isValidSlip44(String(assetReference))) {
    throw new Error(`Invalid reference for namespace slip44`)
  }

  if ([AssetNamespace.ERC20, AssetNamespace.ERC721].includes(assetNamespace)) {
    if (!assetReference.startsWith('0x')) {
      throw new Error(`toCAIP19: assetReference must start with 0x: ${assetReference}`)
    }
    if (assetReference.length !== 42) {
      throw new Error(
        `toCAIP19: assetReference length must be 42, length: ${assetReference.length}`
      )
    }

    // We make Eth contract addresses lower case to simplify comparisons
    assetReference = assetReference.toLowerCase()
  }

  return `${chainId}/${assetNamespace}:${assetReference}`
}

type FromCAIP19Return = {
  chainId: CAIP2
  assetNamespace: AssetNamespace
  assetReference: string
}

const parseCaip19RegExp =
  /((?:[-a-z\d]{3,8}):(?:[-a-zA-Z\d]{1,32}))\/([-a-z\d]{3,8}):([-a-zA-Z\d]+)/

export const fromCAIP19 = (caip19: string): FromCAIP19Return => {
  const matches = parseCaip19RegExp.exec(caip19) ?? []

  // We're okay casting these strings to enums because we check to make sure
  // they are valid enum values
  const chainId = matches[1]
  const assetNamespace = stringToEnum<AssetNamespace>(AssetNamespace, matches[2])
  let assetReference = matches[3]

  if (isCAIP2(chainId) && assetNamespace && assetReference) {
    switch (assetNamespace) {
      case AssetNamespace.ERC20:
      case AssetNamespace.ERC721: {
        assetReference = assetReference.toLowerCase()
      }
    }

    return { chainId, assetNamespace, assetReference }
  }

  throw new Error(`fromCAIP19: invalid CAIP19: ${caip19}`)
}
