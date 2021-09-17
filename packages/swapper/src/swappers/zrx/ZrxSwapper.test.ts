import { ZrxSwapper } from '..'
import { SwapperType } from '../..'

const quote = {}
const wallet = {}

describe('ZrxSwapper', () => {
  describe('constructor', () => {
    it('should return an instance', () => {
      const chainAdapter = {}
      // Dependency inject chainAdapter?
      expect(new ZrxSwapper(chainAdapter)).toBeInstanceOf(ZrxSwapper)
    })
  })

  describe('getType', () => {
    it('should return the swapper type', () => {
      const swapper = new ZrxSwapper()
      expect(swapper.getType()).toBe(SwapperType.Zrx)
    })
  })

  describe('approvalNeeded', () => {
    it('should return true when approval is needed', async () => {
      const swapper = new ZrxSwapper()
      const approval = await swapper.approvalNeeded({ quote, wallet })
      expect(approval.approvalNeeded).toBeTruthy()
      expect(approval.gas).toBe(5)
      expect(approval.gasPrice).toBe(5)
    })

    it('should return false when approval is not needed', async () => {
      const swapper = new ZrxSwapper()
      const approval = await swapper.approvalNeeded({ quote, wallet })
      expect(approval.approvalNeeded).toBeFalsy()
      expect(approval.gas).toBe(5)
      expect(approval.gasPrice).toBe(5)
    })

    it('should return false with no gas or gas price if the sell asset is not Ethereum based', async () => {
      const swapper = new ZrxSwapper()
      const approval = await swapper.approvalNeeded({ quote, wallet })
      expect(approval.approvalNeeded).toBeFalsy()
      expect(approval.gas).toBeUndefined()
      expect(approval.gasPrice).toBeUndefined()
    })

    it('should throw an error if getting quote fails', async () => {
      const swapper = new ZrxSwapper()
      expect(async () => await swapper.approvalNeeded({ quote, wallet })).toThrow(
        'Error getting quote for approval try again'
      )
    })

    it('should throw an error if getting allowance fails', async () => {
      const swapper = new ZrxSwapper()
      expect(async () => await swapper.approvalNeeded({ quote, wallet })).toThrow(
        'Error getting allowance try again'
      )
    })
  })

  describe('approveInfinite', () => {
    it('should return approvals txid', async () => {
      const swapper = new ZrxSwapper()
      const approveTxId = 'approvedTxid'
      const txid = await swapper.approveInfinite({ quote, wallet })
      expect(txid).toBe(approveTxId)
    })

    it('should throw an error if getting quote fails', async () => {
      const swapper = new ZrxSwapper()
      expect(async () => await swapper.approveInfinite({ quote, wallet })).toThrow(
        'approveInfinite - Error getting quote for approval try again'
      )
    })

    it('should throw an error if getting txCount fails', async () => {
      const swapper = new ZrxSwapper()
      expect(async () => await swapper.approveInfinite({ quote, wallet })).toThrow(
        'approveInfinite - Error getting txCount try again'
      )
    })

    it('should throw an error if signTransaction fails', async () => {
      const swapper = new ZrxSwapper()
      expect(async () => await swapper.approveInfinite({ quote, wallet })).toThrow(
        'grantAllowance - Error signing transaction try again'
      )
    })

    it('should throw an error if broadcastTransaction fails', async () => {
      const swapper = new ZrxSwapper()
      expect(async () => await swapper.approveInfinite({ quote, wallet })).toThrow(
        'grantAllowance - Error broadcasting transaction try again'
      )
    })

    it('should throw an error if there is no txid', async () => {
      const swapper = new ZrxSwapper()
      expect(async () => await swapper.approveInfinite({ quote, wallet })).toThrow(
        'grantAllowance - no txid returned from approval broadcast'
      )
    })
  })

  describe('getUsdRate', () => {
    it('returns usd rate', async () => {
      const input = { symbol: 'ETH', contractAddress: '0x83938' }
      const swapper = new ZrxSwapper()
      const usdRate = await swapper.getUsdRate(input)
      expect(usdRate).toEqual('100')
    })

    it('returns 1 when symbol is USDC', async () => {
      const input = { symbol: 'USDC', contractAddress: '0x83938' }
      const swapper = new ZrxSwapper()
      const usdRate = await swapper.getUsdRate(input)
      expect(usdRate).toEqual('1')
    })

    it('throws an error if quote fails', async () => {
      const input = { symbol: 'ETH', contractAddress: '0x83938' }
      const swapper = new ZrxSwapper()
      expect(async () => await swapper.getUsdRate(input)).toThrow(
        'getUsdRate - Error getting quote for usd rate try again'
      )
    })
  })

  describe('availableAssets', () => {
    it('returns ETH network results and adds hideExchange: false to each asset', () => {
      const assets = [{ network: 'ETH' }, { network: 'BTC' }]
      const swapper = new ZrxSwapper()
      const availableAssets = swapper.availableAssets(assets)
      expect(availableAssets.length).toEqual(1)
      expect(availableAssets[0].network).toEqual('ETH')
      expect(availableAssets[0].hideExchange).toEqual(false)
    })
  })

  describe('getMinMax', () => {
    it('returns ETH network results and adds hideExchange: false to each asset', () => {
      const assets = [{ network: 'ETH' }, { network: 'BTC' }]
      const swapper = new ZrxSwapper()
      const availableAssets = swapper.getMinMax(quote)
      expect(availableAssets.length).toEqual(1)
      expect(availableAssets[0].network).toEqual('ETH')
      expect(availableAssets[0].hideExchange).toEqual(false)
    })
  })
})
