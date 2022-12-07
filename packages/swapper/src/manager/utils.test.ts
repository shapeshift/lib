import { Asset } from '@shapeshiftoss/asset-service'
import { ChainId } from '@shapeshiftoss/caip'
import { KnownChainIds } from '@shapeshiftoss/types'

import { Swapper, SwapperName, TradeQuote } from '../api'
import { ETH, FOX } from '../swappers/utils/test-data/assets'
import { getRatioFromQuote } from './utils'

const tradeQuote: TradeQuote<KnownChainIds.EthereumMainnet> = {
  minimumCryptoHuman: '60',
  maximum: '1000000000000000000000',
  sellAmountCryptoPrecision: '1000000000000000000000', // 1000 FOX
  allowanceContract: '0x3624525075b88B24ecc29CE226b0CEc1fFcB6976',
  buyAmountCryptoPrecision: '23448326921811747', // 0.020558 ETH
  feeData: {
    chainSpecific: { estimatedGas: '100000', approvalFee: '700000', gasPrice: '7' },
    buyAssetTradeFeeUsd: '7.656',
    sellAssetTradeFeeUsd: '0',
    networkFee: '3246750000000000',
  },
  rate: '0.00002509060972289251',
  sources: [{ name: SwapperName.Thorchain, proportion: '1' }],
  buyAsset: ETH,
  sellAsset: FOX,
  bip44Params: { purpose: 44, coinType: 60, accountNumber: 0 },
}

describe('getRatioFromQuote', () => {
  it('should get the ratio for a quote', async () => {
    const quote: TradeQuote<ChainId> = tradeQuote
    const swapper: Swapper<ChainId> = {
      getUsdRate: jest
        .fn()
        .mockResolvedValueOnce(0.04)
        .mockResolvedValueOnce(1300)
        .mockResolvedValueOnce(1300),
    } as unknown as Swapper<ChainId>
    const feeAsset: Asset = ETH
    const result = await getRatioFromQuote(quote, swapper, feeAsset)
    expect(result).toBe(0.8624733716570405)
  })
})
