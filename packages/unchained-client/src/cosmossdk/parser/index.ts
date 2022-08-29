import { AssetId, ChainId } from '@shapeshiftoss/caip'
import { BigNumber } from 'bignumber.js'

import { TransferType, TxStatus } from '../../types'
import { Message } from '../types'
import { ParsedTx, Tx } from './types'
import { valuesFromMsgEvents } from './utils'

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

    this.getMessageEvents(tx)

    // For simplicity and to limit scope we assume 1 message per transaction
    // This works ok enough for transactions we generate but way may want to improve in the future
    const { from, to, data, value, origin } = valuesFromMsgEvents(
      tx.messages[0],
      tx.events,
      this.assetId,
      address,
    )

    parsedTx.data = data

    if (from === address && value.gt(0)) {
      parsedTx.transfers = [
        {
          type: TransferType.Send,
          assetId: this.assetId,
          from,
          to,
          totalValue: value.toString(10),
          components: [{ value: value.toString(10) }],
        },
      ]
    }

    if (to === address && value.gt(0)) {
      parsedTx.transfers = [
        {
          type: TransferType.Receive,
          assetId: this.assetId,
          from,
          to,
          totalValue: value.toString(10),
          components: [{ value: value.toString(10) }],
        },
      ]
    }

    // We use origin for fees because some txs have a different from and origin addresses
    if (origin === address) {
      // network fee
      const fees = new BigNumber(tx.fee.amount)
      if (fees.gt(0)) {
        parsedTx.fee = { assetId: this.assetId, value: fees.toString(10) }
      }
    }

    return parsedTx
  }

  getMessageEvents(tx: T): Array<Message> {
    const messages = Object.entries(tx.events).reduce<Array<Message>>(
      (prev, [msgIndex, events]) => {
        if (events.some((event) => event.type === 'message')) {
          const msg = tx.messages[Number(msgIndex)]
          if (!msg) return prev
          return [...prev, tx.messages[Number(msgIndex)]]
        }

        events.forEach((event) => {
          console.log(msgIndex, event.type)
          console.log(msgIndex, event.attributes)
        })

        return prev
      },
      [],
    )

    console.log({ messages })

    return messages
  }
}
