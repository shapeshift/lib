import { ASSET_REFERENCE, AssetId, ChainId, fromChainId, toAssetId } from '@shapeshiftoss/caip'
import { BigNumber } from 'bignumber.js'

import { BitcoinTx } from '../../generated/bitcoin'
import { Status, TransferType, Tx as ParsedTx } from '../../types'
import { aggregateTransfer } from '../../utils'

export interface TransactionParserArgs {
  chainId: ChainId
  assetReference?: string
}

export class TransactionParser {
  chainId: ChainId
  assetId: AssetId

  constructor(args: TransactionParserArgs) {
    this.chainId = args.chainId
    const assetReference = args.assetReference || ASSET_REFERENCE.Bitcoin

    this.assetId = toAssetId({
      ...fromChainId(this.chainId),
      assetNamespace: 'slip44',
      assetReference
    })
  }

  async parse(tx: BitcoinTx, address: string): Promise<ParsedTx> {
    const parsedTx: ParsedTx = {
      address,
      blockHash: tx.blockHash,
      blockHeight: tx.blockHeight,
      blockTime: tx.timestamp,
      chainId: this.chainId,
      confirmations: tx.confirmations,
      status: tx.confirmations > 0 ? Status.Confirmed : Status.Pending,
      transfers: [],
      txid: tx.txid
    }

    tx.vin.forEach((vin) => {
      if (vin.addresses?.includes(address)) {
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
        const fees = new BigNumber(tx.fee ?? 0)
        if (fees.gt(0)) {
          parsedTx.fee = { assetId: this.assetId, value: fees.toString(10) }
        }
      }
    })

    tx.vout.forEach((vout) => {
      if (vout.addresses?.includes(address)) {
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
