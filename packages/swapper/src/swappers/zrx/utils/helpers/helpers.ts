import { AssetNamespace, caip19, WellKnownAsset, WellKnownChain } from '@shapeshiftoss/caip'
import { ChainAdapter } from '@shapeshiftoss/chain-adapters'
import { HDWallet } from '@shapeshiftoss/hdwallet-core'
import { Asset, ChainAdapterType, Quote, QuoteResponse, SwapperType } from '@shapeshiftoss/types'
import { AxiosResponse } from 'axios'
import BigNumber from 'bignumber.js'
import Web3 from 'web3'
import { AbiItem, numberToHex } from 'web3-utils'

import { SwapError } from '../../../../api'
import { ZrxError } from '../../ZrxSwapper'
import { zrxService } from '../zrxService'

export type GetAllowanceRequiredArgs = {
  quote: Quote<ChainAdapterType, SwapperType>
  web3: Web3
  erc20AllowanceAbi: AbiItem[]
}

export type GetERC20AllowanceArgs = {
  erc20AllowanceAbi: AbiItem[]
  web3: Web3
  tokenId: string
  ownerAddress: string
  spenderAddress: string
}

type GrantAllowanceArgs = {
  quote: Quote<ChainAdapterType, SwapperType>
  wallet: HDWallet
  adapter: ChainAdapter<ChainAdapterType.Ethereum>
  erc20Abi: AbiItem[]
  web3: Web3
}

/**
 * Very large amounts like those found in ERC20s with a precision of 18 get converted
 * to exponential notation ('1.6e+21') in javascript. The 0x api doesn't play well with
 * exponential notation so we need to ensure that it is represented as an integer string.
 * This function keeps 17 significant digits, so even if we try to trade 1 Billion of an
 * ETH or ERC20, we still keep 7 decimal places.
 * @param amount
 */
export const normalizeAmount = (amount: string | undefined): string | undefined => {
  if (!amount) return
  return new BigNumber(amount).toNumber().toLocaleString('fullwide', { useGrouping: false })
}

export const getERC20Allowance = async ({
  erc20AllowanceAbi,
  web3,
  tokenId,
  ownerAddress,
  spenderAddress
}: GetERC20AllowanceArgs) => {
  const erc20Contract = new web3.eth.Contract(erc20AllowanceAbi, tokenId)
  return erc20Contract.methods.allowance(ownerAddress, spenderAddress).call()
}

export const getAllowanceRequired = async ({
  quote,
  web3,
  erc20AllowanceAbi
}: GetAllowanceRequiredArgs): Promise<BigNumber> => {
  if (quote.sellAsset.symbol === 'ETH') {
    return new BigNumber(0)
  }

  const ownerAddress = quote.receiveAddress
  const spenderAddress = quote.allowanceContract
  const { assetNamespace, assetReference: tokenId } = caip19.fromCAIP19(quote.sellAsset.assetId)
  if (assetNamespace !== AssetNamespace.ERC20) {
    throw new TypeError(`unsupported asset namespace ${assetNamespace}`)
  }

  if (!ownerAddress || !spenderAddress || !tokenId) {
    throw new SwapError(
      'getAllowanceRequired - receiveAddress, allowanceContract and tokenId are required'
    )
  }

  const allowanceOnChain = await getERC20Allowance({
    web3,
    erc20AllowanceAbi,
    ownerAddress,
    spenderAddress,
    tokenId
  })
  if (allowanceOnChain === '0') {
    return new BigNumber(quote.sellAmount || 0)
  }
  if (!allowanceOnChain) {
    throw new SwapError(
      `No allowance data for ${quote.allowanceContract} to ${quote.receiveAddress}`
    )
  }
  const allowanceRequired = new BigNumber(quote.sellAmount || 0).minus(allowanceOnChain)
  return allowanceRequired.lt(0) ? new BigNumber(0) : allowanceRequired
}

export const getZrxToken = (asset: Asset) => {
  const { assetId } = asset
  switch (assetId) {
    case WellKnownAsset.ETH:
      return 'ETH'
    default: {
      const { chainId, assetNamespace, assetReference } = caip19.fromCAIP19(assetId)
      if (chainId !== WellKnownChain.EthereumMainnet || assetNamespace !== AssetNamespace.ERC20) {
        if (asset.symbol) return asset.symbol
        throw new Error(`getZrxToken - unsupported asset ${assetId}`)
      }
      return assetReference
    }
  }
}

export const getUsdRate = async (asset: Asset): Promise<string> => {
  const rateResponse: AxiosResponse<QuoteResponse> = await zrxService.get<QuoteResponse>(
    '/swap/v1/price',
    {
      params: {
        buyToken: 'USDC',
        buyAmount: '1000000000', // rate is imprecise for low $ values, hence asking for $1000
        sellToken: getZrxToken(asset)
      }
    }
  )

  const price = new BigNumber(rateResponse.data.price)

  if (!price.gt(0)) throw new ZrxError('getUsdRate - Failed to get price data')

  return new BigNumber(1).dividedBy(price).toString()
}

export const grantAllowance = async ({
  quote,
  wallet,
  adapter,
  erc20Abi,
  web3
}: GrantAllowanceArgs): Promise<string> => {
  const { assetNamespace, assetReference: tokenId } = caip19.fromCAIP19(quote.sellAsset.assetId)
  if (assetNamespace !== AssetNamespace.ERC20) {
    throw new TypeError(`unsupported asset namespace ${assetNamespace}`)
  }

  const erc20Contract = new web3.eth.Contract(erc20Abi, tokenId)
  const approveTx = erc20Contract.methods
    .approve(quote.allowanceContract, quote.sellAmount)
    .encodeABI()

  const bip44Params = adapter.buildBIP44Params({
    accountNumber: Number(quote.sellAssetAccountId) || 0
  })

  let grantAllowanceTxToSign, signedTx, broadcastedTxId

  try {
    const { txToSign } = await adapter.buildSendTransaction({
      wallet,
      to: tokenId,
      bip44Params,
      value: '0',
      chainSpecific: {
        erc20ContractAddress: tokenId,
        gasPrice: numberToHex(quote.feeData?.chainSpecific?.gasPrice || 0),
        gasLimit: numberToHex(quote.feeData?.chainSpecific?.estimatedGas || 0)
      }
    })

    grantAllowanceTxToSign = {
      ...txToSign,
      data: approveTx
    }
  } catch (error) {
    throw new Error(`grantAllowance - buildSendTransaction: ${error}`)
  }
  if (wallet.supportsOfflineSigning()) {
    try {
      signedTx = await adapter.signTransaction({ txToSign: grantAllowanceTxToSign, wallet })
    } catch (error) {
      throw new SwapError(`grantAllowance - signTransaction error: ${error}`)
    }

    if (!signedTx) {
      throw new SwapError(`grantAllowance - Signed transaction is required: ${signedTx}`)
    }

    try {
      broadcastedTxId = await adapter.broadcastTransaction(signedTx)
    } catch (error) {
      throw new SwapError(`grantAllowance - broadcastTransaction error: ${error}`)
    }

    return broadcastedTxId
  } else if (wallet.supportsBroadcast() && adapter.signAndBroadcastTransaction) {
    try {
      broadcastedTxId = await adapter.signAndBroadcastTransaction?.({
        txToSign: grantAllowanceTxToSign,
        wallet
      })
    } catch (error) {
      throw new SwapError(`grantAllowance - signAndBroadcastTransaction error: ${error}`)
    }

    return broadcastedTxId
  } else {
    throw new SwapError('grantAllowance - invalid HDWallet config')
  }
}
