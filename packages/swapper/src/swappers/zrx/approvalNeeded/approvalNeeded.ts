import { AxiosResponse } from 'axios'
import { ChainAdapter } from '@shapeshiftoss/chain-adapters'
import { ApprovalNeededInput, ApprovalNeededOutput, ChainTypes, QuoteResponse } from '@shapeshiftoss/types'
import { DEFAULT_SLIPPAGE, AFFILIATE_ADDRESS, DEFAULT_ETH_PATH } from '../utils/constants'

import { ZrxSwapperDeps } from '../ZrxSwapper'
import { zrxService } from '../utils/zrxService'
const APPROVAL_BUY_AMOUNT = '100000000000000000' // A valid buy amount - 0.1 ETH

export async function approvalNeeded(
  { adapterManager }: ZrxSwapperDeps,
  { quote, wallet }: ApprovalNeededInput
): Promise<ApprovalNeededOutput> {
  const { sellAsset } = quote

  if (sellAsset.symbol === 'ETH' || sellAsset.chain !== ChainTypes.Ethereum) {
    return { approvalNeeded: false }
  }


  return { approvalNeeded: true }
}
