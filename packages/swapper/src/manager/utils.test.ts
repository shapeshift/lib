import { Asset } from '@shapeshiftoss/asset-service'
import { ChainId, ethAssetId, ethChainId } from '@shapeshiftoss/caip'
import { KnownChainIds } from '@shapeshiftoss/types'

import { Swapper, SwapperName, TradeQuote } from '../api'
import { ETH, FOX } from '../swappers/utils/test-data/assets'
import { getRatioFromQuote } from './utils'

const ethereum: Asset = {
  assetId: ethAssetId,
  chainId: ethChainId,
  symbol: 'ETH',
  name: 'Ethereum',
  precision: 18,
  color: '#5C6BC0',
  icon: 'https://assets.coincap.io/assets/icons/256/eth.png',
  explorer: 'https://etherscan.io',
  explorerAddressLink: 'https://etherscan.io/address/',
  explorerTxLink: 'https://etherscan.io/tx/',
}

const tradeQuote: TradeQuote<KnownChainIds.EthereumMainnet> = {
  minimumCryptoHuman: '59.658672054814851787728',
  maximum: '100000000000000000000000000',
  sellAmountCryptoPrecision: '10000000000000000000', // 1000 FOX
  allowanceContract: '0x3624525075b88B24ecc29CE226b0CEc1fFcB6976',
  buyAmountCryptoPrecision: '784000000000000',
  feeData: {
    chainSpecific: { estimatedGas: '100000', approvalFee: '700000', gasPrice: '7' },
    buyAssetTradeFeeUsd: '7.656',
    sellAssetTradeFeeUsd: '0',
    networkFee: '700000',
  },
  rate: '0.0000784',
  sources: [{ name: SwapperName.Thorchain, proportion: '1' }],
  buyAsset: ETH,
  sellAsset: FOX,
  bip44Params: { purpose: 44, coinType: 60, accountNumber: 0 },
  recommendedSlippage: '0.00000608624714961082',
}

describe('getRatioFromQuote', () => {
  it('should get the ratio for a quote', async () => {
    const quote: TradeQuote<ChainId> = tradeQuote
    const swapper: Swapper<ChainId> = {
      getUsdRate: jest.fn().mockResolvedValue(1),
    } as unknown as Swapper<ChainId>
    const feeAsset: Asset = ethereum
    const result = await getRatioFromQuote(quote, swapper, feeAsset)
    expect(result).toBe(0.7656784)
  })
})
