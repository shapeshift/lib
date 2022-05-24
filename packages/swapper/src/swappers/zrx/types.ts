import { Asset } from '@shapeshiftoss/types'

import { SwapSource } from '../../api'

export type ZrxCommonResponse = {
  price: string
  gasPrice: string
  buyAmount: string
  sellAmount: string
  allowanceTarget: string
  sources: Array<SwapSource>
}

export type ZrxPriceResponse = ZrxCommonResponse & {
  estimatedGas: string
}

export type ZrxQuoteResponse = ZrxCommonResponse & {
  to: string
  data: string
  gas: string
}

export type InitializeInput = {
  assets: Asset[]
}
