import { SwapperName } from '@shapeshiftoss/swapper'

import { BaseTxMetadata, TradeType } from '../../types'
import { type Tx } from '../parser/types'
import { type SubParser, type TxSpecific, txInteractsWithContract } from '.'
import { ZRX_PROXY_CONTRACT } from './constants'

export interface TxMetadata extends BaseTxMetadata {
  parser: 'zrx'
}

export class Parser implements SubParser<Tx> {
  async parse(tx: Tx): Promise<TxSpecific | undefined> {
    if (!txInteractsWithContract(tx, ZRX_PROXY_CONTRACT)) return
    if (!(tx.tokenTransfers && tx.tokenTransfers.length)) return

    return {
      trade: {
        dexName: SwapperName.Zrx,
        type: TradeType.Trade,
      },
      data: {
        method: undefined, // TODO - add zrx ABI and decode
        parser: 'zrx',
      },
    }
  }
}
