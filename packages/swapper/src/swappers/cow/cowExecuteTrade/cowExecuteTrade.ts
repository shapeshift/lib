import { fromAssetId } from '@shapeshiftoss/caip'
import { ethereum, SignMessageInput, toRootDerivationPath } from '@shapeshiftoss/chain-adapters'
import { bip32ToAddressNList, ETHSignMessage } from '@shapeshiftoss/hdwallet-core'
import { KnownChainIds } from '@shapeshiftoss/types'
import { AxiosResponse } from 'axios'
import { ethers } from 'ethers'

import { ExecuteTradeInput, SwapError, SwapErrorTypes, TradeResult } from '../../../api'
import { isSwapError } from '../../utils/helpers/helpers'
import { CowSwapperDeps } from '../CowSwapper'
import { CowTrade } from '../types'
import {
  COW_SWAP_SETTLEMENT_ADDRESS,
  DEFAULT_APP_DATA,
  ERC20_TOKEN_BALANCE,
  ORDER_KIND_SELL,
  SIGNING_SCHEME
} from '../utils/constants'
import { cowService } from '../utils/cowService'
import {
  CowSwapOrder,
  domain,
  getNowPlusThirtyMinutesTimestamp,
  hashOrder
} from '../utils/helpers/helpers'

export async function cowExecuteTrade(
  { apiUrl, adapter }: CowSwapperDeps,
  { trade, wallet }: ExecuteTradeInput<KnownChainIds.EthereumMainnet>
): Promise<TradeResult> {
  const cowTrade = trade as CowTrade<KnownChainIds.EthereumMainnet>
  const { sellAsset, buyAsset, feeAmountInSellToken, sellAmountWithoutFee } = cowTrade

  const { assetReference: sellAssetErc20Address, assetNamespace: sellAssetNamespace } = fromAssetId(
    sellAsset.assetId
  )
  const { assetReference: buyAssetErc20Address, assetNamespace: buyAssetNamespace } = fromAssetId(
    buyAsset.assetId
  )

  if (buyAssetNamespace !== 'erc20' || sellAssetNamespace !== 'erc20') {
    throw new SwapError('[cowExecuteTrade] - Both assets need to be ERC-20 to use CowSwap', {
      code: SwapErrorTypes.UNSUPPORTED_PAIR,
      details: { buyAssetNamespace, sellAssetNamespace }
    })
  }

  try {
    const orderToSign: CowSwapOrder = {
      sellToken: sellAssetErc20Address,
      buyToken: buyAssetErc20Address,
      sellAmount: sellAmountWithoutFee,
      buyAmount: trade.buyAmount,
      validTo: getNowPlusThirtyMinutesTimestamp(),
      appData: DEFAULT_APP_DATA,
      feeAmount: feeAmountInSellToken,
      kind: ORDER_KIND_SELL,
      partiallyFillable: false,
      receiver: trade.receiveAddress,
      sellTokenBalance: ERC20_TOKEN_BALANCE,
      buyTokenBalance: ERC20_TOKEN_BALANCE
    }

    // We need to construct orderDigest, sign it and send it to cowSwap API, in order to submit a trade
    // Some context about this : https://docs.cow.fi/tutorials/how-to-submit-orders-via-the-api/4.-signing-the-order
    // For more info, check hashOrder method implementation
    const orderDigest = hashOrder(domain(1, COW_SWAP_SETTLEMENT_ADDRESS), orderToSign)

    const bip44Params = ethereum.ChainAdapter.defaultBIP44Params
    const message: SignMessageInput<ETHSignMessage> = {
      messageToSign: {
        addressNList: bip32ToAddressNList(toRootDerivationPath(bip44Params)),
        message: ethers.utils.arrayify(orderDigest)
      },
      wallet
    }

    const signatureOrderDigest = await adapter.signMessage(message)

    // Passing the signature through split/join to normalize the `v` byte.
    // Some wallets do not pad it with `27`, which causes a signature failure
    // `splitSignature` pads it if needed, and `joinSignature` simply puts it back together
    const signature = ethers.utils.joinSignature(ethers.utils.splitSignature(signatureOrderDigest))

    /**
     * /v1/orders
     * params: {
     * sellToken: contract address of token to sell
     * buyToken: contractAddress of token to buy
     * receiver: receiver address
     * validTo: time duration during which order is valid (putting current timestamp + 30 minutes for real order)
     * appData: appData that can be used later, can be defaulted to "0x0000000000000000000000000000000000000000000000000000000000000000"
     * partiallyFillable: false
     * from: sender address
     * kind: "sell" or "buy"
     * feeAmount: amount of fee in sellToken base
     * sellTokenBalance: "erc20" string,
     * buyTokenBalance: "erc20" string,
     * signingScheme: the signing scheme used for the signature
     * signature: a signed message specific to cowswap for this order
     * from: same as receiver address in our case
     * }
     */
    const ordersResponse: AxiosResponse<string> = await cowService.post<string>(
      `${apiUrl}/v1/orders/`,
      {
        ...orderToSign,
        signingScheme: SIGNING_SCHEME,
        signature,
        from: trade.receiveAddress
      }
    )

    return { tradeId: ordersResponse.data }
  } catch (e) {
    if (isSwapError(e)) throw e
    throw new SwapError('[cowExecuteTrade]', {
      cause: e,
      code: SwapErrorTypes.EXECUTE_TRADE_FAILED
    })
  }
}
