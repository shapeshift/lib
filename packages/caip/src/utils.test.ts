import {
  accountIdToChainId,
  accountIdToSpecifier,
  assetIdtoChainId,
  btcAssetId,
  btcChainId,
  ethChainId,
  getCaip2Reference
} from './utils'

describe('accountIdToChainId', () => {
  it('can get eth caip2 from accountId', () => {
    const accountId = 'eip155:1:0xdef1cafe'
    const chainId = accountIdToChainId(accountId)
    expect(chainId).toEqual(ethChainId)
  })

  it('can get btc caip2 from accountId', () => {
    const accountId = 'bip122:000000000019d6689c085ae165831e93:xpubfoobarbaz'
    const chainId = accountIdToChainId(accountId)
    expect(chainId).toEqual(btcChainId)
  })
})

describe('accountIdToSpecifier', () => {
  it('can get eth address from accountId', () => {
    const address = '0xdef1cafe'
    const accountId = 'eip155:1:0xdef1cafe'
    const result = accountIdToSpecifier(accountId)
    expect(result).toEqual(address)
  })

  it('can get xpub form accountId', () => {
    const xpub = 'xpubfoobarbaz'
    const accountId = 'bip122:000000000019d6689c085ae165831e93:xpubfoobarbaz'
    const result = accountIdToSpecifier(accountId)
    expect(result).toEqual(xpub)
  })
})

describe('assetIdtoChainId', () => {
  it('returns a ETH chainId for a given ETH assetId', () => {
    const ethAssetId = 'eip155:1/erc20:0x3155ba85d5f96b2d030a4966af206230e46849cb'
    const chainId = 'eip155:1'
    const result = assetIdtoChainId(ethAssetId)
    expect(result).toEqual(chainId)
  })

  it('returns a BTC chainId for a given BTC assetId', () => {
    const result = assetIdtoChainId(btcAssetId)
    expect(result).toEqual(btcChainId)
  })
})

describe('getCaip2Reference', () => {
  it('returns the reference from a caip2 string with a valid reference', () => {
    const validCaip2 = 'cosmos:cosmoshub-4'
    const validCaip2Reference = 'cosmoshub-4'

    const reference = getCaip2Reference(validCaip2)
    expect(reference).toEqual(validCaip2Reference)
  })
  it('returns undefined from an empty caip2 string', () => {
    const invalidCaip2 = ''

    const reference = getCaip2Reference(invalidCaip2)
    expect(reference).toBeUndefined()
  })

  it('returns undefined from an invalid caip2 string', () => {
    const invalidCaip2 = 'foobar'

    const reference = getCaip2Reference(invalidCaip2)
    expect(reference).toBeUndefined()
  })
})
