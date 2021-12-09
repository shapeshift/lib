import realFs from 'fs'

import { makeBtcData, parseData, parseEthData, writeFiles } from './utils'

const yWETH = {
  inception: 10774489,
  address: '0xe1237aA7f535b0CC33Fd973D66cBf830354D16c7',
  symbol: 'yWETH',
  name: 'WETH',
  display_name: 'ETH',
  icon:
    'https://rawcdn.githack.com/yearn/yearn-assets/3b3d8fd7fa311063f3af618ddc04e8c4a258009f/icons/multichain-tokens/1/0xe1237aA7f535b0CC33Fd973D66cBf830354D16c7/logo-128.png',
  token: {
    name: 'Wrapped Ether',
    symbol: 'WETH',
    address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    decimals: 18,
    display_name: 'ETH',
    icon:
      'https://rawcdn.githack.com/yearn/yearn-assets/3b3d8fd7fa311063f3af618ddc04e8c4a258009f/icons/multichain-tokens/1/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo-128.png'
  },
  tvl: {
    total_assets: 1.3440975607459204e21,
    price: 4346.53360987,
    tvl: 5842165.222726428
  },
  apy: {
    type: 'v1:simple',
    gross_apr: 0.013240587048120034,
    net_apy: 0.010647678260664595,
    fees: {
      performance: 0.2,
      withdrawal: 0,
      management: null,
      keep_crv: null,
      cvx_keep_crv: null
    },
    points: {
      week_ago: 0,
      month_ago: 0,
      inception: 0.010647678260664595
    },
    composite: null
  }
}

const yYFI = {
  inception: 10690968,
  address: '0xBA2E7Fed597fd0E3e70f5130BcDbbFE06bB94fe1',
  symbol: 'yYFI',
  name: 'YFI',
  display_name: 'YFI',
  icon:
    'https://rawcdn.githack.com/yearn/yearn-assets/3b3d8fd7fa311063f3af618ddc04e8c4a258009f/icons/multichain-tokens/1/0xBA2E7Fed597fd0E3e70f5130BcDbbFE06bB94fe1/logo-128.png',
  token: {
    name: 'yearn.finance',
    symbol: 'YFI',
    address: '0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e',
    decimals: 18,
    display_name: 'YFI',
    icon:
      'https://rawcdn.githack.com/yearn/yearn-assets/3b3d8fd7fa311063f3af618ddc04e8c4a258009f/icons/multichain-tokens/1/0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e/logo-128.png'
  },
  tvl: {
    total_assets: 25510491874529993000,
    price: 23528,
    tvl: 600210.8528239417
  },
  apy: {
    type: 'v1:simple',
    gross_apr: 0.011183846540845366,
    net_apy: 0.011245403520755648,
    fees: {
      performance: 0,
      withdrawal: 0,
      management: null,
      keep_crv: null,
      cvx_keep_crv: null
    },
    points: {
      week_ago: 0,
      month_ago: 0,
      inception: 0.011245403520755648
    },
    composite: null
  },
  strategies: [
    {
      address: '0x395F93350D5102B6139Abfc84a7D6ee70488797C',
      name: 'StrategyYFIGovernance'
    }
  ],
  endorsed: true,
  version: '0.1',
  decimals: 18,
  type: 'v1',
  emergency_shutdown: false,
  updated: 1638829836,
  migration: null
}

const yvUSDC = {
  inception: 10690968,
  address: '0xBA2E7Fed597fd0E3e70f5130BcDbbFE06bB94fe1',
  symbol: 'yvUSDC',
  name: 'yvUSDC 0.4.3',
  display_name: 'yvUSDC',
  icon:
    'https://rawcdn.githack.com/yearn/yearn-assets/3b3d8fd7fa311063f3af618ddc04e8c4a258009f/icons/multichain-tokens/1/0xBA2E7Fed597fd0E3e70f5130BcDbbFE06bB94fe1/logo-128.png',
  token: {
    name: 'USD Coin',
    symbol: 'yvUSDC',
    address: '0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e',
    decimals: 18,
    display_name: 'yvUSDC',
    icon:
      'https://rawcdn.githack.com/yearn/yearn-assets/3b3d8fd7fa311063f3af618ddc04e8c4a258009f/icons/multichain-tokens/1/0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e/logo-128.png'
  },
  tvl: {
    total_assets: 25510491874529993000,
    price: 23528,
    tvl: 600210.8528239417
  },
  apy: {
    type: 'v1:simple',
    gross_apr: 0.011183846540845366,
    net_apy: 0.011245403520755648,
    fees: {
      performance: 0,
      withdrawal: 0,
      management: null,
      keep_crv: null,
      cvx_keep_crv: null
    },
    points: {
      week_ago: 0,
      month_ago: 0,
      inception: 0.011245403520755648
    },
    composite: null
  },
  strategies: [
    {
      address: '0x395F93350D5102B6139Abfc84a7D6ee70488797C',
      name: 'StrategyYFIGovernance'
    }
  ],
  endorsed: true,
  version: '0.1',
  decimals: 18,
  type: 'v1',
  emergency_shutdown: false,
  updated: 1638829836,
  migration: null
}

jest.mock('fs', () => ({
  promises: {
    writeFile: jest.fn(async () => undefined)
  }
}))

describe('parseData', () => {
  it('can parse eth data', async () => {
    const result = parseEthData([yYFI, yWETH])
    const expected = {
      'eip155:1/erc20:0xe1237aA7f535b0CC33Fd973D66cBf830354D16c7': 'yYFI',
      'eip155:1/erc20:0xBA2E7Fed597fd0E3e70f5130BcDbbFE06bB94fe1': 'yWETH'
    }
    expect(result).toEqual(expected)
  })
})

describe('writeFiles', () => {
  it('can writeFiles', async () => {
    const data = {
      foo: {
        caip19def: 'efferium'
      },
      bar: {
        caip19ghi: 'fox',
        caip19jkl: 'shib'
      }
    }
    const fooCaips = JSON.stringify(data.foo)
    const barCaips = JSON.stringify(data.bar)
    console.info = jest.fn()
    await writeFiles(data)
    expect(realFs.promises.writeFile).toBeCalledWith(
      './src/adapters/coingecko/generated/foo/adapter.json',
      fooCaips
    )
    expect(realFs.promises.writeFile).toBeCalledWith(
      './src/adapters/coingecko/generated/bar/adapter.json',
      barCaips
    )
    expect(console.info).toBeCalledWith('Generated Yearn CAIP19 adapter data.')
  })
})
