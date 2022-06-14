import { ethereum } from '@shapeshiftoss/chain-adapters'
import { HDWallet } from '@shapeshiftoss/hdwallet-core'
import Web3 from 'web3'

import { ETH, FOX } from '../../utils/test-data/assets'
import { CowBuildTrade } from './CowBuildTrade'

jest.mock('@shapeshiftoss/chain-adapters')
jest.mock('../utils/cowService')
jest.mock('../utils/helpers/helpers', () => {
  return {
    getUsdRate: () => Promise.resolve('1233.65940923824103061992')
  }
})

/*const feeData = {
  fast: {
    txFee: '4080654495000000',
    chainSpecific: {
      gasLimit: '51630',
      gasPrice: '79036500000',
      maxFeePerGas: '216214758112',
      maxPriorityFeePerGas: '2982734547'
    }
  }
}*/

/*const expectedApiInput = {
  appData: '0x0000000000000000000000000000000000000000000000000000000000000000',
  buyToken: '0xc770eefad204b5180df6a14ee197d99d808ee52d',
  from: '0x0000000000000000000000000000000000000000',
  kind: 'sell',
  partiallyFillable: false,
  receiver: '0x0000000000000000000000000000000000000000',
  sellAmountBeforeFee: '1000000000000000000',
  sellToken: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  validTo: 4294967295
}

const expectedTradeQuote: TradeQuote<'eip155:1'> = {
  rate: '14716.04718939437505555958', // 14716 FOX per WETH
  minimum: '0.00810596500550730736',
  maximum: '100000000000000000000000000',
  feeData: {
    fee: '17.95954294012756741283729339486489192096', // $17 USD fee calculated
    chainSpecific: {
      estimatedGas: '51630',
      gasPrice: '79036500000',
      approvalFee: '7903650000000000'
    },
    tradeFee: '0'
  },
  sellAmount: '985442057341242012', // selling 1 WETH = 1000000000000000000 less the fees
  buyAmount: '14501811818247595090576', // 14501 FOX
  sources: [{ name: 'CowSwap', proportion: '1' }],
  allowanceContract: '',
  buyAsset: FOX,
  sellAsset: WETH,
  sellAssetAccountNumber: 0
}*/

const defaultDeps = {
  apiUrl: '',
  adapter: <ethereum.ChainAdapter>{},
  web3: <Web3>{}
}

describe('CowBuildTrade', () => {
  it('should throw an exception if both assets are not erc20s', async () => {
    const tradeInput = {
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
})
