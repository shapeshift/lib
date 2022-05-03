import { SwapSource } from '../../api'

export type ZrxPriceResponse = {
  price: string
  estimatedGas: string
  gasPrice: string
  buyAmount: string
  sellAmount: string
  allowanceTarget: string
  sources: Array<SwapSource>
}

export type ZrxQuoteResponse = {
  price: string
  to: string
  data: string
  gas: string
  gasPrice: string
  buyAmount: string
  sellAmount: string
  allowanceTarget: string
  sources: Array<SwapSource>
}
