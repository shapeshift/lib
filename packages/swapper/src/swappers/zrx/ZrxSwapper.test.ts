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
  Web3.providers.HttpProvider.mockImplementation(() => ({
    host: 'test',
    options: {}
  }))

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
              call: jest.fn(() => '0')
            }))
          }
        }))

        expect(
          await getAllowanceRequired({ quote, web3: web3Instance, erc20AllowanceAbi })
        ).toEqual(new BigNumber(0))
      })
    })
  })

  describe.skip('buildQuoteTx', () => {
    it('should throw error if sellAsset is NOT provided', () => {
      const input = {
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
        buyAmount: '1234.12',
        sellAmount: '1234.12',
        buyAssetAccountId: 'buyAssetId',
        sellAssetAccountId: 'sellAssetId'
      } as unknown as GetQuoteInput

      const wallet = ({} as unknown) as HDWallet

      const { web3Instance, ethChainAdapter } = setup()

      const zrxSwapper = new ZrxSwapper({ adapter: ethChainAdapter, web3: web3Instance })
      expect(zrxSwapper.buildQuoteTx(input, wallet)).toThrowError(
        'ZrxSwapper:buildQuoteTx Both sellAsset and buyAsset are required'
      )
    })
  })
})
