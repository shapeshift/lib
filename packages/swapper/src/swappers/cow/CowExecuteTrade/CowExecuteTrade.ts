import { fromAssetId } from '@shapeshiftoss/caip'
import { AxiosResponse } from 'axios'

import { CowTrade, ExecuteTradeInput, SwapError, SwapErrorTypes, TradeResult } from '../../../api'
import { CowSwapperDeps } from '../CowSwapper'
import { CowSwapOrdersResponse } from '../types'
import { DEFAULT_APP_DATA, ORDER_KIND_SELL, SIGNING_SCHEME } from '../utils/constants'
import { cowService } from '../utils/cowService'
import { getNowPlusThirtyMinutesTimestamp } from '../utils/helpers/helpers'

/*export function normalizeOrder(order: Order): NormalizedOrder {
  if (order.receiver === ethers.constants.AddressZero) {
    throw new Error("receiver cannot be address(0)");
  }

  const normalizedOrder = {
    ...order,
    sellTokenBalance: order.sellTokenBalance ?? OrderBalance.ERC20,
    receiver: order.receiver ?? ethers.constants.AddressZero,
    validTo: timestamp(order.validTo),
    appData: hashify(order.appData),
    buyTokenBalance: normalizeBuyTokenBalance(order.buyTokenBalance),
  };
  return normalizedOrder;
}*/

export async function CowExecuteTrade(
  { apiUrl }: CowSwapperDeps,
  { trade }: ExecuteTradeInput<'eip155:1'>
): Promise<TradeResult> {
  const cowTrade = trade as CowTrade<'eip155:1'>
  const { sellAsset, buyAsset, feeAmountInSellToken } = cowTrade

  const { assetReference: sellAssetErc20Address, assetNamespace: sellAssetNamespace } = fromAssetId(
    sellAsset.assetId
  )
  const { assetReference: buyAssetErc20Address, assetNamespace: buyAssetNamespace } = fromAssetId(
    buyAsset.assetId
  )

  if (buyAssetNamespace !== 'erc20' || sellAssetNamespace !== 'erc20') {
    throw new SwapError('[CowExecuteTrade] - Both assets need to be ERC-20 to use CowSwap', {
      code: SwapErrorTypes.UNSUPPORTED_PAIR,
      details: { buyAssetNamespace, sellAssetNamespace }
    })
  }

  try {

    /*const orderToSign = {
      sellToken: sellAssetErc20Address,
      buyToken: buyAssetErc20Address,
      receiver: trade.receiveAddress,
      sellAmount: trade.sellAmount,
      buyAmount: trade.buyAmount,
      validTo: getNowPlusThirtyMinutesTimestamp(),
      appData: DEFAULT_APP_DATA,
      feeAmount: feeAmountInSellToken,
      kind: ORDER_KIND_SELL,
      partiallyFillable: false,
      sellTokenBalance: 'erc20',
      buyTokenBalance: 'erc20'
    }*/

    /*
    signature = await owner.signMessage(
        ethers.utils.arrayify(hashTypedData(domain, types, data)),
      );
      
    */
   
      /**
 * The EIP-712 type fields definition for a Gnosis Protocol v2 order.
 */
//  export const ORDER_TYPE_FIELDS = [
//   { name: "sellToken", type: "address" },
//   { name: "buyToken", type: "address" },
//   { name: "receiver", type: "address" },
//   { name: "sellAmount", type: "uint256" },
//   { name: "buyAmount", type: "uint256" },
//   { name: "validTo", type: "uint32" },
//   { name: "appData", type: "bytes32" },
//   { name: "feeAmount", type: "uint256" },
//   { name: "kind", type: "string" },
//   { name: "partiallyFillable", type: "bool" },
//   { name: "sellTokenBalance", type: "string" },
//   { name: "buyTokenBalance", type: "string" },
// ];

// export const testSign = async (

// ): Promise<string> => {

//   /*
//   signature = await owner.signMessage(
//       ethers.utils.arrayify(hashTypedData(domain, types, data)),
//     );
//   */

//   /*const domain: TypedDataDomain = {
//     chainId: 'eip155:1',
//     verifyingContract: COW_SWAP_VAULT_RELAYER_ADDRESS
//   }*/

//   const domain: TypedDataDomain = {
//     name: "Gnosis Protocol",
//     version: "v2",
//     chainId: 1,
//     verifyingContract: COW_SWAP_VAULT_RELAYER_ADDRESS
// }

//   const types: Record<string, TypedDataField[]> = { Order: ORDER_TYPE_FIELDS }
//   const value: Record<string, any> = {
//     sellToken: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
//     buyToken: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
//     receiver: "0x463b2E89729a8798413FB3573B31764F2AF68c33",
//     sellAmount: "120599848",
//     buyAmount: "100000000000000000",
//     validTo: 1656088578,
//     appData: "0x487B02C558D729ABAF3ECF17881A4181E5BC2446429A0995142297E897B6EB37",
//     feeAmount: "5076528",
//     kind: "buy",
//     partiallyFillable: false,
//     sellTokenBalance: 'erc20',
//     buyTokenBalance: 'erc20'
//   }

//   // Add link to gnosis github
//   const test = ethers.utils.arrayify(ethers.utils._TypedDataEncoder.hash(domain, types, value))
//   console.log(ethers.utils._TypedDataEncoder.hash(domain, types, value))
//   console.log(test)
//   console.log(JSON.stringify(test))
  
//   const input:SignMessageInput<ETHSignMessage> = {
//     messageToSign: {
//       addressNList: [2147483692, 2147483708, 2147483648, 0, 0],
//       message: JSON.stringify(test)
//     },
//     wallet
//   }
//   console.log(input, adapter)
//   //const a = await ethers.Signer.signMessage()
//   const signature = await adapter.signMessage(input)

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
     * signature: a signed message specific to cowswap for this order
     * signingScheme: the signing scheme used for the signature
     * }
     */
    const ordersResponse: AxiosResponse<CowSwapOrdersResponse> =
      await cowService.post<CowSwapOrdersResponse>(`${apiUrl}/v1/orders/`, {
        sellToken: sellAssetErc20Address,
        buyToken: buyAssetErc20Address,
        receiver: trade.receiveAddress,
        sellAmount: trade.sellAmount,
        buyAmount: trade.buyAmount,
        validTo: getNowPlusThirtyMinutesTimestamp(),
        appData: DEFAULT_APP_DATA,
        feeAmount: feeAmountInSellToken,
        kind: ORDER_KIND_SELL,
        partiallyFillable: false,
        signingScheme: SIGNING_SCHEME,
        signature: '',
        from: trade.receiveAddress
      })

    return { tradeId: ordersResponse.data.uid }
  } catch (e) {
    if (e instanceof SwapError) throw e
    throw new SwapError('[CowExecuteTrade]', {
      cause: e,
      code: SwapErrorTypes.EXECUTE_TRADE_FAILED
    })
  }
}
