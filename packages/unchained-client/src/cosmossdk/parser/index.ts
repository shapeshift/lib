import { AssetId, ChainId } from '@shapeshiftoss/caip'
import { BigNumber } from 'bignumber.js'

import { TransferType, TxStatus } from '../../types'
import { aggregateTransfer } from '../../utils'
import { Message } from '../types'
import { ParsedTx, Tx } from './types'
import { metaData } from './utils'

export interface BaseTransactionParserArgs {
  chainId: ChainId
}

export class BaseTransactionParser<T extends Tx> {
  chainId: ChainId
  assetId: AssetId

  constructor(args: BaseTransactionParserArgs) {
    this.chainId = args.chainId
  }

  async parse(tx: T, address: string): Promise<ParsedTx> {
    const parsedTx: ParsedTx = {
      address,
      blockHash: tx.blockHash,
      blockHeight: tx.blockHeight ?? -1,
      blockTime: tx.timestamp ?? Math.floor(Date.now() / 1000),
      chainId: this.chainId,
      confirmations: tx.confirmations,
      status: tx.confirmations > 0 ? TxStatus.Confirmed : TxStatus.Pending, // TODO: handle failed case
      transfers: [],
      txid: tx.txid,
    }

    const msgs = this.getMessageEvents(tx)
    parsedTx.data = metaData(msgs[0], this.assetId)

    msgs.forEach(({ from = '', to = '', value, origin }) => {
      const amount = new BigNumber(value?.amount ?? 0)

      if (from === address && amount.gt(0)) {
        parsedTx.transfers = aggregateTransfer(
          parsedTx.transfers,
          TransferType.Send,
          this.assetId,
          from,
          to,
          amount.toString(10),
        )
      }

      if (to === address && amount.gt(0)) {
        parsedTx.transfers = aggregateTransfer(
          parsedTx.transfers,
          TransferType.Receive,
          this.assetId,
          from,
          to,
          amount.toString(10),
        )
      }

      // We use origin for fees because some txs have a different from and origin addresses
      if (origin === address) {
        // network fee
        const fees = new BigNumber(tx.fee.amount)
        if (fees.gt(0)) {
          parsedTx.fee = { assetId: this.assetId, value: fees.toString(10) }
        }
      }
    })

    return parsedTx
  }

  getMessageEvents(tx: T): Array<Message> {
    const messages = Object.entries(tx.events).reduce<Array<Message>>((prev, [msgIndex, event]) => {
      const msg = event['message'] ? tx.messages[Number(msgIndex)] : undefined

      if (msg) return [...prev, msg]

      const msgs: Array<Message> = []
      Object.entries(event).forEach(([type, attribute]) => {
        switch (type) {
          default:
            console.log(msgIndex, type)
            console.log(msgIndex, attribute)
            return
        }
      })

      return [...prev, ...msgs]
    }, [])

    return messages
  }
}
