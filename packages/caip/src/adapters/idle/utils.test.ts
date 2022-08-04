import { IdleSdk, IdleVault } from '@shapeshiftoss/investor-idle'
import realFs from 'fs'
import toLower from 'lodash/toLower'

import { parseEthData, writeFiles } from './utils'

const vault1: IdleVault = {
  address: "0xE9ada97bDB86d827ecbaACCa63eBcD8201D8b12E",
  strategy: "Senior Tranche",
  poolName: "Idle DAI Senior Tranche",
  tokenName: "DAI",
  cdoAddress: "0xd0DbcD556cA22d3f3c142e9a3220053FD7a247BC",
  protocolName: "Idle",
  pricePerShare: 1.00616306,
  underlyingTVL: 100644.03950916,
  underlyingAddress: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
  apr: 0.4928506,
  tvl: 100644.03950916
}

const vaults2: IdleVault = {
  address: "0x15794DA4DCF34E674C18BbFAF4a67FF6189690F5",
  strategy: "Senior Tranche",
  poolName: "Convex FRAX3CRV Senior Tranche",
  tokenName: "FRAX3CRV",
  cdoAddress: "0x4ccaf1392a17203edab55a1f2af3079a8ac513e7",
  protocolName: "Convex",
  pricePerShare: 1.02689613,
  underlyingTVL: 6101.90921916,
  underlyingAddress: "0xd632f22692FaC7611d2AA1C0D552930D43CAEd3B",
  apr: 5.31535063,
  tvl: 6101.90921916
}

jest.mock('fs', () => ({
  promises: {
    writeFile: jest.fn(async () => undefined)
  }
}))

describe('adapters:idle:utils', () => {
  describe('idle: parseEthData', () => {
    it('can parse eth data', async () => {
      const result = parseEthData([vault1, vault2])
      const expected = {
        [`eip155:1/erc20:${toLower(vault1.address)}`]: vault1.address,
        [`eip155:1/erc20:${toLower(vault2.address)}`]: vault2.address,
      }
      expect(result).toEqual(expected)
    })
  })

  describe('writeFiles', () => {
    it('can writeFiles', async () => {
      const data = {
        foo: {
          assetIdAbc: 'bitcorn',
          assetIdDef: 'efferium'
        }
      }
      const fooAssetIds = JSON.stringify(data.foo)
      console.info = jest.fn()
      await writeFiles(data)
      expect(realFs.promises.writeFile).toBeCalledWith(
        './src/adapters/idle/generated/foo/adapter.json',
        fooAssetIds
      )
      expect(console.info).toBeCalledWith('Generated Idle AssetId adapter data.')
    })
  })
})
