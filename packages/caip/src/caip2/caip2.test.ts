import { isCAIP2 } from './caip2'

describe('isCAIP2', () => {
  it('should return false for eip155 (missing network reference)', () => {
    expect(isCAIP2('eip155')).toBe(false)
  })

  it('should return true for eip155:1 (ETH mainnet)', () => {
    expect(isCAIP2('eip155:1')).toBe(true)
  })

  it('should return false on eip155:2 (invalid network reference)', () => {
    expect(isCAIP2('eip155:2')).toBe(false)
  })

  it('should return true for ethereum testnets', () => {
    expect(isCAIP2('eip155:3')).toBe(true)
    expect(isCAIP2('eip155:4')).toBe(true)
  })

  it('should return true for bip122:000000000019d6689c085ae165831e93 (BTC mainnet)', () => {
    expect(isCAIP2('bip122:000000000019d6689c085ae165831e93')).toBe(true)
  })

  it('should return true for bip122:000000000933ea01ad0ee984209779ba (BTC testnet)', () => {
    expect(isCAIP2('bip122:000000000933ea01ad0ee984209779ba')).toBe(true)
  })

  it('should return false for bip122:1 (invalid network reference)', () => {
    expect(isCAIP2('bip122:1')).toBe(false)
  })

  it('should return false for bip122 (missing network reference)', () => {
    expect(isCAIP2('bip122')).toBe(false)
  })

  it('should return false for the empty string', () => {
    expect(isCAIP2('')).toBe(false)
  })

  it('should return true for cosmoshub-4 and vega-testnet', () => {
    expect(isCAIP2('cosmos:cosmoshub-4')).toBe(true)
    expect(isCAIP2('cosmos:vega-testnet')).toBe(true)
  })

  it('should return true for osmosis-1 and osmo-testnet-1', () => {
    expect(isCAIP2('cosmos:osmosis-1')).toBe(true)
    expect(isCAIP2('cosmos:osmo-testnet-1')).toBe(true)
  })

  it('should return false for an unknown cosmos chain', () => {
    expect(isCAIP2('cosmos:fakechain-1')).toBe(false)
  })
})
