import { ChainAdapter } from '@shapeshiftoss/chain-adapters'
import { HDWallet } from '@shapeshiftoss/hdwallet-core'
import { KnownChainIds } from '@shapeshiftoss/types'

import { setupQuote } from '../../utils/test-data/setupSwapQuote'
import { ZrxExecuteTradeInput, ZrxSwapperDeps, ZrxTrade } from '../types'
import { zrxExecuteTrade } from './zrxExecuteTrade'

describe('ZrxExecuteTrade', () => {
  const { sellAsset, buyAsset } = setupQuote()
  const txid = '0xffaac3dd529171e8a9a2adaf36b0344877c4894720d65dfd86e4b3a56c5a857e'
  let wallet = {
    supportsOfflineSigning: jest.fn(() => true),
  } as unknown as HDWallet

  const adapter = {
    buildBIP44Params: jest.fn(() => ({ purpose: 44, coinType: 60, accountNumber: 0 })),
    buildSendTransaction: jest.fn(() => Promise.resolve({ txToSign: '0000000000000000' })),
    signTransaction: jest.fn(() => Promise.resolve('0000000000000000000')),
    broadcastTransaction: jest.fn(() => Promise.resolve(txid)),
    signAndBroadcastTransaction: jest.fn(() => Promise.resolve(txid)),
  } as unknown as ChainAdapter<'eip155:1'>

  const deps = { adapter } as unknown as ZrxSwapperDeps

  const trade: ZrxTrade<KnownChainIds.EthereumMainnet> = {
    buyAsset,
    sellAsset,
    sellAmount: '1',
    buyAmount: '',
    depositAddress: '0x123',
    receiveAddress: '0xc770eefad204b5180df6a14ee197d99d808ee52d',
    sellAssetAccountNumber: 0,
    txData: '0x123',
    rate: '1',
    feeData: {
      fee: '0',
      chainSpecific: { approvalFee: '123600000', estimatedGas: '1235', gasPrice: '1236' },
      tradeFee: '0',
      tradeFeeBuyAsset: '0',
      tradeFeeSellAsset: '0',
      minerFee: '0',
    },
    sources: [],
  }

  const execTradeInput: ZrxExecuteTradeInput<KnownChainIds.EthereumMainnet> = {
    trade,
    wallet,
  }

  it('returns txid if offline signing is supported', async () => {
    expect(
      await zrxExecuteTrade<KnownChainIds.EthereumMainnet>(deps, {
        ...execTradeInput,
      }),
    ).toEqual({ tradeId: txid })
  })

  it('returns txid if offline signing is unsupported', async () => {
    wallet = {
      supportsOfflineSigning: jest.fn(() => false),
      supportsBroadcast: jest.fn(() => true),
    } as unknown as HDWallet

    expect(
      await zrxExecuteTrade<KnownChainIds.EthereumMainnet>(deps, {
        ...execTradeInput,
      }),
    ).toEqual({ tradeId: txid })
  })
})
