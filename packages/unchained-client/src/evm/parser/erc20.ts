import { ChainId, fromChainId, toAssetId } from '@shapeshiftoss/caip'
import { ethers } from 'ethers'

import erc20 from './abi/erc20'
import { SubParser, Tx, TxParser, TxSpecific } from './types'
import { getSigHash } from './utils'

interface ParserArgs {
  chainId: ChainId
  provider: ethers.providers.JsonRpcProvider
}

export class Parser<T extends Tx> implements SubParser<T> {
  provider: ethers.providers.JsonRpcProvider

  readonly chainId: ChainId
  readonly abiInterface = new ethers.utils.Interface(erc20)

  readonly supportedFunctions = {
    approveSigHash: this.abiInterface.getSighash('approve')
  }

  constructor(args: ParserArgs) {
    this.provider = args.provider
    this.chainId = args.chainId
  }

  async parse(tx: T): Promise<TxSpecific | undefined> {
    if (!tx.inputData) return

    const txSigHash = getSigHash(tx.inputData)

    if (!Object.values(this.supportedFunctions).some((hash) => hash === txSigHash)) return

    const decoded = this.abiInterface.parseTransaction({ data: tx.inputData })

    // failed to decode input data
    if (!decoded) return

    return {
      data: {
        assetId: toAssetId({
          ...fromChainId(this.chainId),
          assetNamespace: 'erc20',
          assetReference: tx.to
        }),
        method: decoded.name,
        parser: TxParser.ERC20
      }
    }
  }
}
