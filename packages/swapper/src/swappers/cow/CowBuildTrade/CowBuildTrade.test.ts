import { ethereum } from '@shapeshiftoss/chain-adapters'
import { HDWallet } from '@shapeshiftoss/hdwallet-core'
import { Asset } from '@shapeshiftoss/types'
import Web3 from 'web3'

import { BuildTradeInput, Trade } from '../../../api'
import { bn } from '../../utils/bignumber'
import { GetAllowanceRequiredArgs } from '../../utils/helpers/helpers'
import { ETH, FOX, WBTC, WETH } from '../../utils/test-data/assets'
import { CowSwapperDeps } from '../CowSwapper'
import { cowService } from '../utils/cowService'
import { CowBuildTrade } from './CowBuildTrade'

jest.mock('@shapeshiftoss/chain-adapters')
jest.mock('../utils/cowService')
jest.mock('../utils/helpers/helpers', () => {
  return {
    getUsdRate: (_args: CowSwapperDeps, input: Asset) => {
      if (input.assetId === WETH.assetId) {
        return Promise.resolve('1233.65940923824103061992')
      }

      return Promise.resolve('20978.38')
    }
  }
})

jest.mock('../../utils/helpers/helpers', () => {
  return {
    ...jest.requireActual('../../utils/helpers/helpers'),
    getAllowanceRequired: (args: GetAllowanceRequiredArgs) => {
      if (args.sellAsset.assetId === WBTC.assetId) {
        return bn('1000000000000000000')
      }
      return bn(0)
    }
  }
})

const feeData = {
  fast: {
    txFee: '4080654495000000',
    chainSpecific: {
      gasLimit: '51630',
      gasPrice: '79036500000',
      maxFeePerGas: '216214758112',
      maxPriorityFeePerGas: '2982734547'
    }
  }
}

const expectedApiInputWethToFox = {
  appData: '0x0000000000000000000000000000000000000000000000000000000000000000',
  buyToken: '0xc770eefad204b5180df6a14ee197d99d808ee52d',
  from: 'address11',
  kind: 'sell',
  partiallyFillable: false,
  receiver: 'address11',
  sellAmountBeforeFee: '1000000000000000000',
  sellToken: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  validTo: 4294967295
}

const expectedApiInputWbtcToWeth = {
  appData: '0x0000000000000000000000000000000000000000000000000000000000000000',
  buyToken: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  from: 'address11',
  kind: 'sell',
  partiallyFillable: false,
  receiver: 'address11',
  sellAmountBeforeFee: '100000000',
  sellToken: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
  validTo: 4294967295
}

const expectedTradeWethToFox: Trade<'eip155:1'> = {
  rate: '14716.04718939437505555958', // 14716 FOX per WETH
  feeData: {
    fee: '14557942658757988', // fee in WETH
    chainSpecific: {
      estimatedGas: '51630',
      gasPrice: '79036500000'
    },
    tradeFee: '0'
  },
  sellAmount: '1000000000000000000',
  buyAmount: '14501811818247595090576', // 14501 FOX
  sources: [{ name: 'CowSwap', proportion: '1' }],
  buyAsset: FOX,
  sellAsset: WETH,
  sellAssetAccountNumber: 0,
  receiveAddress: 'address11'
}

const expectedTradeQuoteWbtcToWethWithApprovalFee: Trade<'eip155:1'> = {
  rate: '19.139398102523845323456857493095', // 19.14 WETH per WBTC
  feeData: {
    fee: '2931322143956216.3557777214', // fee in WETH
    chainSpecific: {
      estimatedGas: '51630',
      gasPrice: '79036500000',
      approvalFee: '7903650000000000'
    },
    tradeFee: '0'
  },
  sellAmount: '100000000',
  buyAmount: '19136098853078932263', // 19.13 WETH
  sources: [{ name: 'CowSwap', proportion: '1' }],
  buyAsset: WETH,
  sellAsset: WBTC,
  sellAssetAccountNumber: 0,
  receiveAddress: 'address11'
}

const defaultDeps: CowSwapperDeps = {
  apiUrl: '',
  adapter: <ethereum.ChainAdapter>{},
  web3: <Web3>{},
  feeAsset: WETH
}

describe('CowBuildTrade', () => {
  it('should throw an exception if both assets are not erc20s', async () => {
    const tradeInput: BuildTradeInput = {
      chainId: 'eip155:1',
      sellAsset: ETH,
      buyAsset: FOX,
      sellAmount: '11111',
      sendMax: true,
      sellAssetAccountNumber: 1,
      buyAssetAccountNumber: 2,
      wallet: <HDWallet>{}
    }

    await expect(CowBuildTrade(defaultDeps, tradeInput)).rejects.toThrow(
      '[CowBuildTrade] - Both assets need to be ERC-20 to use CowSwap'
    )
  })

  it('should call cowService with correct parameters, handle the fees and return the correct trade when selling WETH', async () => {
    const deps: CowSwapperDeps = {
      apiUrl: 'https://api.cow.fi/mainnet/api',
      adapter: {
        getAddress: jest.fn(() => Promise.resolve('address11')),
        getFeeData: jest.fn(() => Promise.resolve(feeData))
      } as unknown as ethereum.ChainAdapter,
      web3: <Web3>{},
      feeAsset: WETH
    }

    const tradeInput: BuildTradeInput = {
      chainId: 'eip155:1',
      sellAsset: WETH,
      buyAsset: FOX,
      sellAmount: '1000000000000000000',
      sendMax: true,
      sellAssetAccountNumber: 0,
      buyAssetAccountNumber: 1,
      wallet: <HDWallet>{}
    }

    ;(cowService.post as jest.Mock<unknown>).mockReturnValue(
      Promise.resolve({
        data: {
          quote: {
            ...expectedApiInputWethToFox,
            sellAmountBeforeFee: undefined,
            sellAmount: '985442057341242012',
            buyAmount: '14501811818247595090576',
            feeAmount: '14557942658757988',
            sellTokenBalance: 'erc20',
            buyTokenBalance: 'erc20'
          }
        }
      })
    )

    const trade = await CowBuildTrade(deps, tradeInput)

    expect(trade).toEqual(expectedTradeWethToFox)
    expect(cowService.post).toHaveBeenCalledWith(
      'https://api.cow.fi/mainnet/api/v1/quote/',
      expectedApiInputWethToFox
    )
  })

  it('should call cowService with correct parameters, handle the fees and return the correct trade when selling WBTC with allowance being required', async () => {
    const deps: CowSwapperDeps = {
      apiUrl: 'https://api.cow.fi/mainnet/api',
      adapter: {
        getAddress: jest.fn(() => Promise.resolve('address11')),
        getFeeData: jest.fn(() => Promise.resolve(feeData))
      } as unknown as ethereum.ChainAdapter,
      web3: <Web3>{},
      feeAsset: WETH
    }

    const tradeInput: BuildTradeInput = {
      chainId: 'eip155:1',
      sellAsset: WBTC,
      buyAsset: WETH,
      sellAmount: '100000000',
      sendMax: true,
      sellAssetAccountNumber: 0,
      buyAssetAccountNumber: 1,
      wallet: <HDWallet>{}
    }

    ;(cowService.post as jest.Mock<unknown>).mockReturnValue(
      Promise.resolve({
        data: {
          quote: {
            ...expectedApiInputWbtcToWeth,
            sellAmountBeforeFee: undefined,
            sellAmount: '99982762',
            buyAmount: '19136098853078932263',
            feeAmount: '17238',
            sellTokenBalance: 'erc20',
            buyTokenBalance: 'erc20'
          }
        }
      })
    )

    const trade = await CowBuildTrade(deps, tradeInput)

    expect(trade).toEqual(expectedTradeQuoteWbtcToWethWithApprovalFee)
    expect(cowService.post).toHaveBeenCalledWith(
      'https://api.cow.fi/mainnet/api/v1/quote/',
      expectedApiInputWbtcToWeth
    )
  })
})
