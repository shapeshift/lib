import { ContractTypes, NetworkTypes } from '@shapeshiftoss/asset-service'
import axios, { AxiosInstance, AxiosResponse } from 'axios'
import BigNumber from 'bignumber.js'
import { HDWallet } from '@shapeshiftoss/hdwallet-core'
import { ZrxSwapper, normalizeAmount, getAllowanceRequired } from './ZrxSwapper'
import Web3 from 'web3'
import { ChainAdapterManager, ChainIdentifier } from '@shapeshiftoss/chain-adapters'
import { erc20AllowanceAbi } from '../../utils/abi/erc20-abi'

const DEFAULT_SLIPPAGE = new BigNumber(0.5).div(100).toString() // 0.5%
const axiosConfig = {
  baseURL: 'https://api.0x.org/',
  timeout: 10000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }
}

jest.mock('web3')

const setupQuote = () => {
  const sellAsset = {
    name: 'Fox',
    chain: ChainIdentifier.Ethereum,
    network: NetworkTypes.MAINNET,
    precision: 18,
    tokenId: '0xc770eefad204b5180df6a14ee197d99d808ee52d',
    contractType: ContractTypes.ERC20,
    color: '#FFFFFF',
    secondaryColor: '#FFFFFF',
    icon: 'https://assets.coincap.io/assets/icons/fox@2x.png',
    sendSupport: true,
    receiveSupport: true,
    symbol: 'FOX'
  }
  const buyAsset = {
    name: 'WETH',
    chain: ChainIdentifier.Ethereum,
    network: NetworkTypes.MAINNET,
    precision: 18,
    tokenId: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    contractType: ContractTypes.ERC20,
    color: '#FFFFFF',
    secondaryColor: '#FFFFFF',
    icon: 'https://assets.coingecko.com/coins/images/2518/thumb/weth.png?1628852295',
    explorer: 'https://etherscan.io',
    explorerTxLink: 'https://etherscan.io/tx/',
    sendSupport: true,
    receiveSupport: true,
    symbol: 'WETH'
  }

  const quoteInput = {
    sellAsset,
    buyAsset,
    success: true,
    sellAmount: '1000000000000000000',
    slippage: DEFAULT_SLIPPAGE,
    allowanceContract: '0xDd4a7cc4092515C130667C1bFd53Be0DE91062C5',
    receiveAddress: '0x22d76bB60B70fF2F3aD698a753EC7E64aeB0426C',
    sellAssetAccountId: 'sellAccountId',
    buyAssetAccountId: 'buyAccountId'
  }
  return { quoteInput, buyAsset, sellAsset }
}

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
  const web3Provider = new Web3.providers.HttpProvider(ethNodeUrl)
  const web3Instance = new Web3(web3Provider)
  const axiosInstance = axios.create(axiosConfig)
  const zrxSwapper = new ZrxSwapper({
    adapterManager: chainAdapterManager,
    zrxHttpClient: axiosInstance,
    web3: web3Instance
  })

  return { web3Instance, zrxSwapper, axiosInstance }
}

describe('ZrxSwapper', () => {
  const { web3Instance, zrxSwapper } = setup()
  const { quoteInput, sellAsset, buyAsset } = setupQuote()

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
      it('should return 0 if the sellAsset symbol is ETH', async () => {
        const quote = {
          ...quoteInput,
          sellAsset: { ...sellAsset, symbol: 'ETH' }
        }
        expect(
          await getAllowanceRequired({ quote, web3: web3Instance, erc20AllowanceAbi })
        ).toEqual(new BigNumber(0))
      })

      it('should return sellAmount if allowanceOnChain is 0', async () => {
        const allowanceOnChain = '0'

        // @ts-ignore
        web3Instance.eth.Contract.mockImplementation(() => ({
          methods: {
            allowance: jest.fn(() => ({
              call: jest.fn(() => allowanceOnChain)
            }))
          }
        }))

        expect(
          await getAllowanceRequired({ quote: quoteInput, web3: web3Instance, erc20AllowanceAbi })
        ).toEqual(new BigNumber(quoteInput.sellAmount))
      })

      it('should thow error if allowanceOnChain null or undefined', async () => {
        const allowanceOnChain = null

        // @ts-ignore
        web3Instance.eth.Contract.mockImplementation(() => ({
          methods: {
            allowance: jest.fn(() => ({
              call: jest.fn(() => allowanceOnChain)
            }))
          }
        }))

        expect(async () => {
          await getAllowanceRequired({ quote: quoteInput, web3: web3Instance, erc20AllowanceAbi })
        }).rejects.toThrow(
          `No allowance data for ${quoteInput.allowanceContract} to ${quoteInput.receiveAddress}`
        )
      })

      it('should return 0 if sellAmount minus allowanceOnChain is negative', async () => {
        const sellAmount = '100'
        const allowanceOnChain = '1000'
        const quote = {
          ...quoteInput,
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
          ...quoteInput,
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
    const walletAddress = '0xc770eefad204b5180df6a14ee197d99d808ee52d'
    const wallet = ({
      ethGetAddress: jest.fn(() => Promise.resolve(walletAddress))
    } as unknown) as HDWallet

    it('should throw error if sellAmount AND buyAmount is provided', async () => {
      const input = {
        ...quoteInput,
        buyAmount: '1234.12',
        sellAmount: '1234.12'
      }

      expect(async () => {
        await zrxSwapper.buildQuoteTx(input, wallet)
      }).rejects.toThrow(
        'ZrxSwapper:buildQuoteTx Exactly one of buyAmount or sellAmount is required'
      )
    })

    it('should throw error if sellAmount AND buyAmount are NOT provided', async () => {
      const input = {
        ...quoteInput,
        sellAmount: '',
        buyAmount: ''
      }

      expect(async () => {
        await zrxSwapper.buildQuoteTx(input, wallet)
      }).rejects.toThrow(
        'ZrxSwapper:buildQuoteTx Exactly one of buyAmount or sellAmount is required'
      )
    })

    it('should throw error if sellAssetAccountId is NOT provided', async () => {
      const input = {
        ...quoteInput,
        sellAssetAccountId: ''
      }

      expect(async () => {
        await zrxSwapper.buildQuoteTx(input, wallet)
      }).rejects.toThrow(
        'ZrxSwapper:buildQuoteTx Both sellAssetAccountId and buyAssetAccountId are required'
      )
    })

    it('should throw error if buyAssetAccountId is NOT provided', async () => {
      const input = {
        ...quoteInput,
        buyAssetAccountId: ''
      }

      expect(async () => {
        await zrxSwapper.buildQuoteTx(input, wallet)
      }).rejects.toThrow(
        'ZrxSwapper:buildQuoteTx Both sellAssetAccountId and buyAssetAccountId are required'
      )
    })

    it('should throw error if tokenId, symbol and network are not provided for buyAsset', async () => {
      const input = {
        ...quoteInput,
        buyAsset: {
          ...buyAsset,
          tokenId: '',
          symbol: '',
          network: ''
        }
      }

      expect(async () => {
        await zrxSwapper.buildQuoteTx(input, wallet)
      }).rejects.toThrow(
        'ZrxSwapper:buildQuoteTx One of buyAssetContract or buyAssetSymbol or buyAssetNetwork are required'
      )
    })

    it('should throw error if tokenId, symbol and network are not provided for sellAsset', async () => {
      const input = {
        ...quoteInput,
        sellAsset: {
          ...sellAsset,
          tokenId: '',
          symbol: '',
          network: ''
        }
      }

      expect(async () => {
        await zrxSwapper.buildQuoteTx(input, wallet)
      }).rejects.toThrow(
        'ZrxSwapper:buildQuoteTx One of sellAssetContract or sellAssetSymbol or sellAssetNetwork are required'
      )
    })
  })
})
