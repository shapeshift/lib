export default [
  {
    address: '0x671a912C10bba0CFA74Cfc2d6Fba9BA1ed9530B2',
    typeId: 'VAULT_V2',
    token: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
    name: 'LINK yVault',
    version: '0.4.2',
    symbol: 'yvLINK',
    decimals: '18',
    tokenId: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
    underlyingTokenBalance: {
      amount: '194235921428981580651584',
      amountUsdc: '1688029418073'
    },
    metadata: {
      controller: '0x0000000000000000000000000000000000000000',
      totalAssets: '0',
      totalSupply: '0',
      pricePerShare: '1014362590480550303',
      migrationAvailable: false,
      latestVaultAddress: '0x671a912C10bba0CFA74Cfc2d6Fba9BA1ed9530B2',
      depositLimit: '3000000000000000000000000',
      emergencyShutdown: false,
      apy: {
        type: 'v2:averaged',
        gross_apr: 0.02,
        net_apy: 0,
        fees: {
          performance: 0.2,
          withdrawal: null,
          management: 0.02,
          keep_crv: null,
          cvx_keep_crv: null
        },
        points: {
          week_ago: 0,
          month_ago: 0,
          inception: 0.013356848252682463
        },
        composite: null
      },
      displayIcon:
        'https://raw.githack.com/yearn/yearn-assets/master/icons/multichain-tokens/1/0x514910771AF9Ca656af840dff83E8264EcF986CA/logo-128.png',
      displayName: 'LINK',
      defaultDisplayToken: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
      depositsDisabled: false,
      withdrawalsDisabled: false,
      allowZapIn: true,
      allowZapOut: true,
      zapInWith: 'zapperZapIn',
      zapOutWith: 'zapperZapOut',
      hideIfNoDeposits: false,
      strategies: {
        vaultAddress: '0x671a912C10bba0CFA74Cfc2d6Fba9BA1ed9530B2',
        strategiesMetadata: [
          {
            address: '0xF864f92e88054AA05639324090b411C1D55B4a5B',
            name: '88 MPH Reinvest',
            description:
              'Supplies LINK to [88 MPH](https://88mph.app/earn) to earn a fixed-rate yield and MPH tokens. Earned tokens are harvested, sold for more LINK which is deposited back into the strategy.',
            protocols: ['88Mph']
          }
        ]
      },
      historicEarnings: [
        {
          earnings: {
            amountUsdc: '180102893736',
            amount: '20723839965246662013416'
          },
          date: '2022-05-10T00:00:00.000Z'
        }
      ]
    }
  },
  {
    address: '0x5f18C75AbDAe578b483E5F43f12a39cF75b973a9',
    typeId: 'VAULT_V2',
    token: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    name: 'USDC yVault',
    version: '0.3.0',
    symbol: 'yvUSDC',
    decimals: '6',
    tokenId: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    underlyingTokenBalance: {
      amount: '37744686868618',
      amountUsdc: '37673009708254'
    },
    metadata: {
      controller: '0x0000000000000000000000000000000000000000',
      totalAssets: '0',
      totalSupply: '0',
      pricePerShare: '1096274',
      migrationAvailable: true,
      latestVaultAddress: '0xa354F35829Ae975e850e23e9615b11Da1B3dC4DE',
      depositLimit: '0',
      emergencyShutdown: false,
      apy: {
        type: 'v2:simple',
        gross_apr: -0.002685787411627061,
        net_apy: -0.0021463675727894094,
        fees: {
          performance: 0.2,
          withdrawal: null,
          management: 0,
          keep_crv: null,
          cvx_keep_crv: null
        },
        points: {
          week_ago: 0,
          month_ago: -0.0021463675727894094,
          inception: 0.06423548367771148
        },
        composite: null
      },
      displayIcon:
        'https://raw.githack.com/yearn/yearn-assets/master/icons/multichain-tokens/1/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo-128.png',
      displayName: 'USDC',
      defaultDisplayToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      depositsDisabled: false,
      withdrawalsDisabled: false,
      allowZapIn: true,
      allowZapOut: true,
      zapInWith: 'zapperZapIn',
      zapOutWith: 'zapperZapOut',
      migrationContract: '0x1824df8D751704FA10FA371d62A37f9B8772ab90',
      migrationTargetVault: '0xa354F35829Ae975e850e23e9615b11Da1B3dC4DE',
      hideIfNoDeposits: true,
      strategies: {
        vaultAddress: '0x5f18C75AbDAe578b483E5F43f12a39cF75b973a9',
        strategiesMetadata: [
          {
            address: '0x36822d0b11F4594380181cE6e76bd4986d46c389',
            name: 'Router-yvUSDC-030-043',
            description: "I don't have a description for this strategy yet",
            protocols: []
          }
        ]
      },
      historicEarnings: [
        {
          earnings: {
            amountUsdc: '31272254930074',
            amount: '31331753930789'
          },
          date: '2022-05-11T00:00:00.000Z'
        }
      ]
    }
  }
]
