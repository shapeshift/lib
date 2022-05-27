import { btcAssetId, ethAssetId } from '@shapeshiftoss/caip'

import { ThorchainSwapper } from './ThorchainSwapper'

//TODO(ryankk): move result data to helper file
jest.mock('axios', () => ({
  get: jest.fn(() =>
    Promise.resolve({
      data: {
        result: [
          {
            asset: 'BTC.BTC',
            assetDepth: '91027798705',
            assetPrice: '10280.68095465986',
            assetPriceUSD: '29850.505131750208',
            liquidityUnits: '536055974608843',
            poolAPY: '0.09305294391574037',
            runeDepth: '935827756491105',
            status: 'available',
            synthSupply: '3281284823',
            synthUnits: '9838954536080',
            units: '545894929144923',
            volume24h: '15031085906495'
          },
          {
            asset: 'ETH.ETH',
            assetDepth: '915018987646',
            assetPrice: '676.2118757936507',
            assetPriceUSD: '1963.4172247490626',
            liquidityUnits: '273709963437801',
            poolAPY: '0.10532151323548256',
            runeDepth: '618746706022909',
            status: 'available',
            synthSupply: '3572065751',
            synthUnits: '535301524652',
            units: '274245264962453',
            volume24h: '9890096673763'
          },
          {
            asset: 'ETH.FOX-0XC770EEFAD204B5180DF6A14EE197D99D808EE52D',
            assetDepth: '166650912393467',
            assetPrice: '0.05303710198887871',
            assetPriceUSD: '0.15399605260336216',
            liquidityUnits: '10015457121887',
            poolAPY: '0.2597568967423438',
            runeDepth: '8838681437152',
            status: 'available',
            synthSupply: '17428372569375',
            synthUnits: '552604585625',
            units: '10568061707512',
            volume24h: '251596933033'
          }
        ]
      }
    })
  )
}))

describe('ThorchainSwapper', () => {
  const foxAssetId = 'eip155:1/erc20:0xc770eefad204b5180df6a14ee197d99d808ee52d'

  it('fetches supported assetIds on initialize', () => {
    const swapper = new ThorchainSwapper({
      midgardUrl: 'localhost:3000'
    })

    expect(swapper.supportedAssetIds).toEqual([btcAssetId, ethAssetId, foxAssetId])
  })
})
