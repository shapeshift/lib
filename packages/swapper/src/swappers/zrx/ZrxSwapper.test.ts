import BigNumber from 'bignumber.js'
import { HDWallet } from '@shapeshiftoss/hdwallet-core'
import { ZrxSwapper, normalizeAmount, getAllowanceRequired } from './ZrxSwapper'
import { GetQuoteInput } from '../../api'
import Web3 from 'web3'
import { ChainAdapterManager, ChainIdentifier } from '@shapeshiftoss/chain-adapters'
import { erc20AllowanceAbi } from '../../utils/abi/erc20-abi'

jest.mock('web3')

const setup = () => {
  // @ts-ignore
  Web3.mockImplementation(() => ({
    eth: {
      Contract: jest.fn(() => ({
        methods: {
          allowance: jest.fn(() => ({
            call: jest.fn()
          }))
        }
      }))
    }
  }))

  const unchainedUrls = {
    [ChainIdentifier.Ethereum]: 'http://localhost:31300/api/v1'
  }
  const ethNodeUrl = 'http://localhost:1000'
  const chainAdapterManager = new ChainAdapterManager(unchainedUrls)
  const ethChainAdapter = chainAdapterManager.byChain(ChainIdentifier.Ethereum)
  const web3Provider = new Web3.providers.HttpProvider(ethNodeUrl)
  const web3Instance = new Web3(web3Provider)

  return { web3Instance, ethChainAdapter }
}

describe('ZrxSwapper', () => {
  describe('utils', () => {
    describe('normalizeAmount', () => {
      it('should return undefined if not amount is given', () => {
        expect(normalizeAmount(undefined)).toBeUndefined()
      })

      it('should return a string number rounded to the 16th decimal place', () => {
        const result = normalizeAmount('586084736227728377283728272309128120398')
        expect(result).toEqual('586084736227728400000000000000000000000')
      })
    })

    describe('getAllowanceRequired', () => {
      const { web3Instance } = setup()

      it('should return 0 if the sellAsset symbol is ETH', async () => {
        const quote = {
          success: true,
          sellAsset: {
            tokenId: '',
            network: 'ethereum',
            symbol: 'ETH'
          },
          buyAsset: {
            tokenId: '0xc770eefad204b5180df6a14ee197d99d808ee52d',
            symbol: 'FOX',
            network: 'ethereum'
          }
        }
        expect(
          await getAllowanceRequired({ quote, web3: web3Instance, erc20AllowanceAbi })
        ).toEqual(new BigNumber(0))
      })

      it('should return 0 if allowanceOnChain is 0', async () => {
        const allowanceOnChain = '0'
        const quote = {
          success: true,
          sellAsset: {
            tokenId: '0xc770eefad204b5180df6a14ee197d99d808ee52d',
            symbol: 'FOX',
            network: 'ethereum'
          },
          buyAsset: {
            tokenId: '0xc770eefad204b5180df6a14ee197d99d808ee52d',
            symbol: 'LINK',
            network: 'ethereum'
          }
        }

        // @ts-ignore
        web3Instance.eth.Contract.mockImplementation(() => ({
          methods: {
            allowance: jest.fn(() => ({
              call: jest.fn(() => allowanceOnChain)
            }))
          }
        }))

        expect(
          await getAllowanceRequired({ quote, web3: web3Instance, erc20AllowanceAbi })
        ).toEqual(new BigNumber(0))
      })

      it('should thow error if allowanceOnChain null or undefined', async () => {
        const quote = {
          success: true,
          allowanceContract: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
          receiveAddress: '0xc770eefad204b5180df6a14ee197d99d808ee52d',
          sellAsset: {
            tokenId: '0xc770eefad204b5180df6a14ee197d99d808ee52d',
            symbol: 'FOX',
            network: 'ethereum'
          },
          buyAsset: {
            tokenId: '0xc770eefad204b5180df6a14ee197d99d808ee52d',
            symbol: 'LINK',
            network: 'ethereum'
          }
        }

        // @ts-ignore
        web3Instance.eth.Contract.mockImplementation(() => ({
          methods: {
            allowance: jest.fn(() => ({
              call: jest.fn(() => null)
            }))
          }
        }))

        expect(async () => {
          await getAllowanceRequired({ quote, web3: web3Instance, erc20AllowanceAbi })
        }).rejects.toThrow(
          `No allowance data for ${quote.allowanceContract} to ${quote.receiveAddress}`
        )
      })

      it('should return 0 if sellAmount minus allowanceOnChain is negative', async () => {
        const sellAmount = '100'
        const allowanceOnChain = '1000'
        const quote = {
          success: true,
          allowanceContract: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
          receiveAddress: '0xc770eefad204b5180df6a14ee197d99d808ee52d',
          sellAsset: {
            tokenId: '0xc770eefad204b5180df6a14ee197d99d808ee52d',
            symbol: 'FOX',
            network: 'ethereum'
          },
          buyAsset: {
            tokenId: '0xc770eefad204b5180df6a14ee197d99d808ee52d',
            symbol: 'LINK',
            network: 'ethereum'
          },
          sellAmount
        }

        // @ts-ignore
        web3Instance.eth.Contract.mockImplementation(() => ({
          methods: {
            allowance: jest.fn(() => ({
              call: jest.fn(() => allowanceOnChain)
            }))
          }
        }))

        expect(
          await getAllowanceRequired({ quote, web3: web3Instance, erc20AllowanceAbi })
        ).toEqual(new BigNumber(0))
      })

      it('should return sellAsset minus allowanceOnChain', async () => {
        const sellAmount = '1000'
        const allowanceOnChain = '100'
        const quote = {
          success: true,
          allowanceContract: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
          receiveAddress: '0xc770eefad204b5180df6a14ee197d99d808ee52d',
          sellAsset: {
            tokenId: '0xc770eefad204b5180df6a14ee197d99d808ee52d',
            symbol: 'FOX',
            network: 'ethereum'
          },
          buyAsset: {
            tokenId: '0xc770eefad204b5180df6a14ee197d99d808ee52d',
            symbol: 'LINK',
            network: 'ethereum'
          },
          sellAmount
        }

        // @ts-ignore
        web3Instance.eth.Contract.mockImplementation(() => ({
          methods: {
            allowance: jest.fn(() => ({
              call: jest.fn(() => allowanceOnChain)
            }))
          }
        }))

        expect(
          await getAllowanceRequired({ quote, web3: web3Instance, erc20AllowanceAbi })
        ).toEqual(new BigNumber(900))
      })
    })
  })

  describe('buildQuoteTx', () => {
    it('should throw error if sellAmount AND buyAmount is provided', async () => {
      const walletAddress = '0xc770eefad204b5180df6a14ee197d99d808ee52d'
      const input = ({
        buyAsset: {},
        sellAsset: {},
        buyAmount: '1234.12',
        sellAmount: '1234.12'
      } as unknown) as GetQuoteInput

      const wallet = ({
        ethGetAddress: jest.fn(() => Promise.resolve(walletAddress))
      } as unknown) as HDWallet

      const { web3Instance, ethChainAdapter } = setup()

      const zrxSwapper = new ZrxSwapper({ adapter: ethChainAdapter, web3: web3Instance })
      expect(async () => {
        await zrxSwapper.buildQuoteTx(input, wallet)
      }).rejects.toThrow(
        'ZrxSwapper:buildQuoteTx Exactly one of buyAmount or sellAmount is required'
      )
    })

    it('should throw error if sellAmount AND buyAmount are NOT provided', async () => {
      const walletAddress = '0xc770eefad204b5180df6a14ee197d99d808ee52d'
      const input = ({
        buyAsset: {
          tokenId: '0xc770eefad204b5180df6a14ee197d99d808ee52d',
          symbol: 'FOX',
          network: 'ethereum'
        },
        sellAsset: {
          tokenId: '0xc770eefad204b5180df6a14ee197d99d808ee52d',
          symbol: 'LINK',
          network: 'ethereum'
        }
      } as unknown) as GetQuoteInput

      const wallet = ({
        ethGetAddress: jest.fn(() => Promise.resolve(walletAddress))
      } as unknown) as HDWallet

      const { web3Instance, ethChainAdapter } = setup()

      const zrxSwapper = new ZrxSwapper({ adapter: ethChainAdapter, web3: web3Instance })
      expect(async () => {
        await zrxSwapper.buildQuoteTx(input, wallet)
      }).rejects.toThrow(
        'ZrxSwapper:buildQuoteTx Exactly one of buyAmount or sellAmount is required'
      )
    })

    it('should throw error if sellAssetAccountId is NOT provided', async () => {
      const walletAddress = '0xc770eefad204b5180df6a14ee197d99d808ee52d'
      const input = ({
        buyAsset: {
          tokenId: '0xc770eefad204b5180df6a14ee197d99d808ee52d',
          symbol: 'FOX',
          network: 'ethereum'
        },
        sellAsset: {
          tokenId: '0xc770eefad204b5180df6a14ee197d99d808ee52d',
          symbol: 'LINK',
          network: 'ethereum'
        },
        sellAmount: '1234.12',
        buyAssetAccountId: 'buyAccountId'
      } as unknown) as GetQuoteInput

      const wallet = ({
        ethGetAddress: jest.fn(() => Promise.resolve(walletAddress))
      } as unknown) as HDWallet

      const { web3Instance, ethChainAdapter } = setup()

      const zrxSwapper = new ZrxSwapper({ adapter: ethChainAdapter, web3: web3Instance })
      expect(async () => {
        await zrxSwapper.buildQuoteTx(input, wallet)
      }).rejects.toThrow(
        'ZrxSwapper:buildQuoteTx Both sellAssetAccountId and buyAssetAccountId are required'
      )
    })

    it('should throw error if buyAssetAccountId is NOT provided', async () => {
      const walletAddress = '0xc770eefad204b5180df6a14ee197d99d808ee52d'
      const input = ({
        buyAsset: {
          tokenId: '0xc770eefad204b5180df6a14ee197d99d808ee52d',
          symbol: 'FOX',
          network: 'ethereum'
        },
        sellAsset: {
          tokenId: '0xc770eefad204b5180df6a14ee197d99d808ee52d',
          symbol: 'LINK',
          network: 'ethereum'
        },
        sellAmount: '1234.12',
        sellAssetAccountId: 'sellAccountId'
      } as unknown) as GetQuoteInput

      const wallet = ({
        ethGetAddress: jest.fn(() => Promise.resolve(walletAddress))
      } as unknown) as HDWallet

      const { web3Instance, ethChainAdapter } = setup()

      const zrxSwapper = new ZrxSwapper({ adapter: ethChainAdapter, web3: web3Instance })
      expect(async () => {
        await zrxSwapper.buildQuoteTx(input, wallet)
      }).rejects.toThrow(
        'ZrxSwapper:buildQuoteTx Both sellAssetAccountId and buyAssetAccountId are required'
      )
    })

    it('should throw error if tokenId, symbol and network are not provided for buyAsset', async () => {
      const walletAddress = '0xc770eefad204b5180df6a14ee197d99d808ee52d'
      const input = ({
        buyAsset: {
          tokenId: '',
          symbol: '',
          network: ''
        },
        sellAsset: {
          tokenId: '0xc770eefad204b5180df6a14ee197d99d808ee52d',
          symbol: 'LINK',
          network: 'ethereum'
        },
        sellAmount: '1234.12',
        sellAssetAccountId: 'sellAccountId',
        buyAssetAccountId: 'buyAccountId'
      } as unknown) as GetQuoteInput

      const wallet = ({
        ethGetAddress: jest.fn(() => Promise.resolve(walletAddress))
      } as unknown) as HDWallet

      const { web3Instance, ethChainAdapter } = setup()

      const zrxSwapper = new ZrxSwapper({ adapter: ethChainAdapter, web3: web3Instance })
      expect(async () => {
        await zrxSwapper.buildQuoteTx(input, wallet)
      }).rejects.toThrow(
        'ZrxSwapper:buildQuoteTx One of buyAssetContract or buyAssetSymbol or buyAssetNetwork are required'
      )
    })

    it('should throw error if tokenId, symbol and network are not provided for sellAsset', async () => {
      const walletAddress = '0xc770eefad204b5180df6a14ee197d99d808ee52d'
      const input = ({
        buyAsset: {
          tokenId: '0xc770eefad204b5180df6a14ee197d99d808ee52d',
          symbol: 'LINK',
          network: 'ethereum'
        },
        sellAsset: {
          tokenId: '',
          symbol: '',
          network: ''
        },
        sellAmount: '1234.12',
        sellAssetAccountId: 'sellAccountId',
        buyAssetAccountId: 'buyAccountId'
      } as unknown) as GetQuoteInput

      const wallet = ({
        ethGetAddress: jest.fn(() => Promise.resolve(walletAddress))
      } as unknown) as HDWallet

      const { web3Instance, ethChainAdapter } = setup()

      const zrxSwapper = new ZrxSwapper({ adapter: ethChainAdapter, web3: web3Instance })
      expect(async () => {
        await zrxSwapper.buildQuoteTx(input, wallet)
      }).rejects.toThrow(
        'ZrxSwapper:buildQuoteTx One of sellAssetContract or sellAssetSymbol or sellAssetNetwork are required'
      )
    })
  })
})
