// Allow explicit any since this is a test file
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Test BitcoinChainAdapter
 * @group unit
 */
import { ChainAdapterManager } from '../ChainAdapterManager'
import { BitcoinChainAdapter } from './BitcoinChainAdapter'
import { BTCInputScriptType, BTCSignTx } from '@shapeshiftoss/hdwallet-core'
import { BuildSendTxInput, FeeData, GetAddressParams, SignBitcoinTxInput } from '../api'
import { ChainAdapter, ChainIdentifier } from '../'
import { NativeAdapterArgs, NativeHDWallet } from '@shapeshiftoss/hdwallet-native'
import { HDWallet } from '@shapeshiftoss/hdwallet-core'
import { Bitcoin } from '@shapeshiftoss/unchained-client'
import { ErrorHandler } from '../error/ErrorHandler'
import dotenv from 'dotenv'
dotenv.config({
  path: __dirname + '/../../.env'
})

const defaultEthPath = `m/44'/60'/0'/0/0`
const defaultBtcPath = `m/44'/0'/0'/0/0`
const unchainedUrls = {
  [ChainIdentifier.Bitcoin]: 'http://localhost:31300',
  [ChainIdentifier.Ethereum]: 'http://localhost:31300'
}

let chainAdapterManager: ChainAdapterManager
let wallet: NativeHDWallet
let btcChainAdapter: ChainAdapter
let address: string

const getWallet = async (): Promise<NativeHDWallet> => {
  console.log('process.env.CLI_MNEMONIC: ', process.env.CLI_MNEMONIC)
  const nativeAdapterArgs: NativeAdapterArgs = {
    mnemonic: process.env.CLI_MNEMONIC,
    deviceId: 'test'
  }
  wallet = new NativeHDWallet(nativeAdapterArgs)
  await wallet.initialize()

  return wallet
}

describe('BitcoinChainAdapter', () => {
  beforeAll(async () => {
    try {
      chainAdapterManager = new ChainAdapterManager(unchainedUrls)
    } catch (error) {
      console.log(
        'Could not instantiate new ChainAdapterManager. Is an Unchained instance running at either ',
        unchainedUrls
      )
    }
    wallet = await getWallet()
    btcChainAdapter = chainAdapterManager.byChain(ChainIdentifier.Bitcoin)
    const getAddressParams: GetAddressParams = {
      wallet,
      purpose: "44'",
      account: "0'",
      isChange: false,
      scriptType: BTCInputScriptType.SpendAddress
    }
    address = (await btcChainAdapter.getAddress(getAddressParams)) || ''
  })

  describe('getType', () => {
    it('should return ChainIdentifier.Bitcoin', async () => {
      const type = btcChainAdapter.getType()
      expect(type).toEqual(ChainIdentifier.Bitcoin)
    })
  })

  describe('getAccount', () => {
    it('should return account info for a specified address', async () => {
      const exampleResponse: Bitcoin.BitcoinAccount = {
        pubkey: '1EjpFGTWJ9CGRJUMA3SdQSdigxM31aXAFx',
        balance: '0'
      }
      const data = await btcChainAdapter.getAccount(address)
      expect(data).toMatchObject(exampleResponse)
    })

    it('should throw for an unspecified address', async () => {
      await expect(btcChainAdapter.getAccount('')).rejects.toThrow(
        'Address parameter is not defined'
      )
    })
  })

  describe('getTxHistory', () => {
    it('should return tx history for a specified address', async () => {
      const data = await btcChainAdapter.getTxHistory('1EjpFGTWJ9CGRJUMA3SdQSdigxM31aXAFx')
      console.log(data)
    })

    it.skip('should fail for an unspecified address', async () => {
      expect(await btcChainAdapter.getTxHistory('')).rejects.toThrow(
        "Parameter 'address' is not defined"
      )
    })
  })

  describe('buildSendTransaction', () => {
    it.skip('should return a formatted BTCSignTx object for a valid BuildSendTxInput parameter', async () => {
      const txInput: BuildSendTxInput = {
        asset: { id: '123', symbol: 'BTC' },
        recipients: [
          {
            address: '1FH6ehAd5ZFXCM1cLGzHxK1s4dGdq1JusM',
            value: 2000
          }
        ],
        wallet,
        fee: '100',
        opReturnData: 'nm, u?'
      }
      console.log(JSON.stringify(txInput))
      const unsignedTx: BTCSignTx = (await btcChainAdapter.buildSendTransaction(txInput))
        ?.txToSign as BTCSignTx
      console.log(unsignedTx)
      expect(unsignedTx).toBeDefined()
    })

    it.skip('should return estimated fees for a valid BuildSendTxInput parameter', async () => {
      const txInput: BuildSendTxInput = {
        asset: { id: '123', symbol: 'BTC' },
        recipients: [
          {
            address: '1FH6ehAd5ZFXCM1cLGzHxK1s4dGdq1JusM',
            value: 2000
          }
        ],
        wallet,
        fee: '100',
        opReturnData: 'nm, u?'
      }
      const fees: FeeData = (await btcChainAdapter.buildSendTransaction(txInput))
        ?.estimatedFees as FeeData
      console.log(fees)
      expect(fees).toBeDefined()
    })
  })

  describe('signTransaction', () => {
    it.skip('should sign a properly formatted signTxInput object', async () => {
      const txInput = {
        asset: { id: '123', symbol: 'BTC' },
        recipients: [{ address: '1FH6ehAd5ZFXCM1cLGzHxK1s4dGdq1JusM', value: 2000 }],
        wallet,
        fee: '100',
        opReturnData: 'sup fool'
      }

      const unsignedTx = await btcChainAdapter.buildSendTransaction(txInput)

      const signedTx = await btcChainAdapter.signTransaction({
        wallet,
        txToSign: unsignedTx?.txToSign
      } as SignBitcoinTxInput)

      console.log(JSON.stringify(signedTx))
    })
  })

  // TODO: MockMe
  // describe('broadcastTransaction', () => {})

  describe('getFeeData', () => {
    it('should return current BTC network fees', async () => {
      const data: FeeData = await btcChainAdapter.getFeeData({})
      expect(data).toEqual(
        expect.objectContaining({
          fastest: { minMinutes: 0, maxMinutes: 35, effort: 5, fee: expect.any(Number) },
          halfHour: { minMinutes: 0, maxMinutes: 35, effort: 4, fee: expect.any(Number) },
          '1hour': { minMinutes: 0, maxMinutes: 50, effort: 3, fee: expect.any(Number) },
          '6hour': { minMinutes: 30, maxMinutes: 300, effort: 2, fee: expect.any(Number) },
          '24hour': { minMinutes: 30, maxMinutes: 660, effort: 1, fee: expect.any(Number) }
        })
      )
    })
  })

  describe('getAddress', () => {
    it('should return a spend address for valid derivation path parameters', async () => {
      const getAddressParams: GetAddressParams = {
        wallet,
        purpose: "44'",
        account: "0'",
        isChange: false,
        scriptType: BTCInputScriptType.SpendAddress
      }
      const address: string | undefined = await btcChainAdapter.getAddress(getAddressParams)

      expect(address).toStrictEqual('1EjpFGTWJ9CGRJUMA3SdQSdigxM31aXAFx')
    })
  })

  describe('validateAddress', () => {
    it('should return true for a valid address', async () => {
      const referenceAddress = '1EjpFGTWJ9CGRJUMA3SdQSdigxM31aXAFx'
      const expectedReturnValue = { valid: true, result: 'valid' }
      const res = await btcChainAdapter.validateAddress(referenceAddress)
      expect(res).toMatchObject(expectedReturnValue)
    })

    it('should return false for an invalid address', async () => {
      const referenceAddress = ''
      const expectedReturnValue = { valid: false, result: 'invalid' }
      const res = await btcChainAdapter.validateAddress(referenceAddress)
      expect(res).toMatchObject(expectedReturnValue)
    })
  })
})
