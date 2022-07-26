import { ethChainId } from '@shapeshiftoss/caip'
import { btcAssetId, btcChainId, ethAssetId } from '@shapeshiftoss/caip'
import { ChainAdapterManager } from '@shapeshiftoss/chain-adapters'
import Web3 from 'web3'

import { ethMidgardPool, foxMidgardPool, mockInboundAdresses } from '../test-data/midgardResponse'
import { thorService } from '../thorService'
import { estimateTradeFee } from './estimateTradeFee'

jest.mock('../thorService')

describe('estimateTradeFee', () => {
  const deps = {
    midgardUrl: 'localhost:3000',
    adapterManager: new Map([
      [ethChainId, { getFeeAssetId: () => ethAssetId }],
      [btcChainId, { getFeeAssetId: () => btcAssetId }]
    ]) as ChainAdapterManager,
    web3: <Web3>{}
  }
  it('should correctly estimate a trade fee for bitcoin as buy asset', async () => {
    ;(thorService.get as jest.Mock<unknown>).mockReturnValue(
      Promise.resolve({ data: mockInboundAdresses })
    )
    const estimatedTradeFee = await estimateTradeFee(deps, btcAssetId)

    const expectedResult = '16362'
    expect(estimatedTradeFee).toEqual(expectedResult)
  })
  it('should correctly estimate a trade fee for ethereum as buy asset', async () => {
    ;(thorService.get as jest.Mock<unknown>).mockReturnValue(
      Promise.resolve({ data: mockInboundAdresses })
    )
    const estimatedTradeFee = await estimateTradeFee(deps, ethAssetId)

    const expectedResult = '32241720000000000'
    expect(estimatedTradeFee).toEqual(expectedResult)
  })
  it('should correctly estimate a trade fee for an ethereum erc20 as a buy asset', async () => {
    ;(thorService.get as jest.Mock<unknown>)
      .mockReturnValueOnce(Promise.resolve({ data: mockInboundAdresses }))
      .mockReturnValueOnce(Promise.resolve({ data: [foxMidgardPool, ethMidgardPool] }))
    const estimatedTradeFee = await estimateTradeFee(
      deps,
      'eip155:1/erc20:0xc770eefad204b5180df6a14ee197d99d808ee52d'
    )

    const expectedResult = '760354594956692487365'
    expect(estimatedTradeFee).toEqual(expectedResult)
  })
  it('should throw if trying to get fee data for an unsupported buy asset', async () => {
    ;(thorService.get as jest.Mock<unknown>).mockReturnValue(
      Promise.resolve({ data: mockInboundAdresses })
    )

    return expect(
      estimateTradeFee(deps, 'eip155:1/erc20:0x4204204204204204204204204204204204204204')
    ).rejects.toThrow(`[estimateTradeFee] - undefined thorId for given buyAssetId`)
  })
})
