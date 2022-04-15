import { CAIP19 } from '@shapeshiftoss/caip'

export function getZrxSupportedAssets(): CAIP19[] {
  // TODO: Implement this somehow. Should we use AssetService?
  return [
    'eip155:1/erc20:0xc770eefad204b5180df6a14ee197d99d808ee52d',
    'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
  ]
}
