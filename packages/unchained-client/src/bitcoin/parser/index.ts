import { Tx as BlockbookTx } from '@shapeshiftoss/blockbook'
import {
  AssetId,
  AssetNamespace,
  AssetReference,
  ChainId,
  fromCAIP2,
  toCAIP19
} from '@shapeshiftoss/caip'
import { BigNumber } from 'bignumber.js'

import { Status, TransferType, Tx as ParsedTx } from '../../types'
import { aggregateTransfer } from '../../utils'

export interface TransactionParserArgs {
  chainId: ChainId
  rpcUrl: string
}

export class TransactionParser {
  chainId: ChainId
  assetId: AssetId

  constructor(args: TransactionParserArgs) {
    this.chainId = args.chainId

    this.assetId = toCAIP19({
      ...fromCAIP2(this.chainId),
      assetNamespace: AssetNamespace.Slip44,
      assetReference: AssetReference.Bitcoin
    })
  }

  async parse(tx: BlockbookTx, address: string): Promise<ParsedTx> {
    const parsedTx: ParsedTx = {
      address,
      blockHash: tx.blockHash,
      blockHeight: tx.blockHeight,
      blockTime: tx.blockTime,
      chainId: this.chainId,
      confirmations: tx.confirmations,
      status: tx.confirmations > 0 ? Status.Confirmed : Status.Pending,
      transfers: [],
      txid: tx.txid
    }

    tx.vin.forEach((vin) => {
      if (vin.isAddress && vin.addresses?.includes(address)) {
        // send amount
        const sendValue = new BigNumber(vin.value ?? 0)
        if (sendValue.gt(0)) {
          parsedTx.transfers = aggregateTransfer(
            parsedTx.transfers,
            TransferType.Send,
            this.assetId,
            vin.addresses?.[0] ?? '',
            tx.vout[0].addresses?.[0] ?? '',
            sendValue.toString(10)
          )
        }

        // network fee
        const fees = new BigNumber(tx.fees ?? 0)
        if (fees.gt(0)) {
          parsedTx.fee = { assetId: this.assetId, value: fees.toString(10) }
        }
      }
    })

    tx.vout.forEach((vout) => {
      if (vout.isAddress && vout.addresses?.includes(address)) {
        // receive amount
        const receiveValue = new BigNumber(vout.value ?? 0)
        if (receiveValue.gt(0)) {
          parsedTx.transfers = aggregateTransfer(
            parsedTx.transfers,
            TransferType.Receive,
            this.assetId,
            tx.vin[0].addresses?.[0] ?? '',
            vout.addresses?.[0] ?? '',
            receiveValue.toString(10)
          )
        }
      }
    })

    return parsedTx
  }
}
