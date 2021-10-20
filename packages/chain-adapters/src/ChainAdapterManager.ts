import { ChainTypes } from '@shapeshiftoss/types'
import * as unchained from '@shapeshiftoss/unchained-client'
import { ChainAdapter, isChainAdapterOfType } from './api'
import * as bitcoin from './bitcoin'
import * as ethereum from './ethereum'

export type UnchainedUrl = {
  httpUrl: string
  wsUrl: string
}
export type UnchainedUrls = Partial<Record<ChainTypes, UnchainedUrl>>

export class ChainAdapterManager {
  private supported: Map<ChainTypes, () => ChainAdapter<ChainTypes>> = new Map()
  private instances: Map<ChainTypes, ChainAdapter<ChainTypes>> = new Map()

  constructor(unchainedUrls: UnchainedUrls) {
    if (!unchainedUrls) {
      throw new Error('Blockchain urls required')
    }
    ;(Object.entries(unchainedUrls) as Array<[keyof UnchainedUrls, UnchainedUrl]>).forEach(
      ([type, { httpUrl: basePath, wsUrl }]) => {
        switch (type) {
          case ChainTypes.Ethereum: {
            const http = new unchained.ethereum.api.V1Api(
              new unchained.ethereum.api.Configuration({ basePath })
            )
            const ws = new unchained.ethereum.ws.Client(wsUrl, {
              handshakeTimeout: 5000
            })
            return this.addChain(type, () => new ethereum.ChainAdapter({ providers: { http, ws } }))
          }
          case ChainTypes.Bitcoin: {
            const http = new unchained.bitcoin.api.V1Api(
              new unchained.bitcoin.api.Configuration({ basePath })
            )
            return this.addChain(
              type,
              () => new bitcoin.ChainAdapter({ providers: { http }, coinName: 'Bitcoin' })
            )
          }
          default:
            throw new Error(`ChainAdapterManager: cannot instantiate ${type} chain adapter`)
        }
      }
    )
  }

  /**
   * Add support for a network by providing a class that implements ChainAdapter
   *
   * @example
   * import { ChainAdapterManager, UtxoChainAdapter } from 'chain-adapters'
   * const manager = new ChainAdapterManager(client)
   * manager.addChain('bitcoin', () => new UtxoChainAdapter('BTG', client))
   * @param {ChainTypes} network - Coin/network symbol from Asset query
   * @param {Function} factory - A function that returns a ChainAdapter instance
   */
  addChain<T extends ChainTypes>(chain: T, factory: () => ChainAdapter<T>): void {
    if (typeof chain !== 'string' || typeof factory !== 'function') {
      throw new Error('Parameter validation error')
    }
    this.supported.set(chain, factory)
  }

  getSupportedChains(): Array<ChainTypes> {
    return Array.from(this.supported.keys())
  }

  getSupportedAdapters(): Array<() => ChainAdapter<ChainTypes>> {
    return Array.from(this.supported.values())
  }

  /*** Get a ChainAdapter instance for a network */
  byChain<T extends ChainTypes>(chain: T): ChainAdapter<T> {
    let adapter = this.instances.get(chain)
    if (!adapter) {
      const factory = this.supported.get(chain)
      if (factory) {
        adapter = factory()
        if (!adapter || !isChainAdapterOfType(chain, adapter)) {
          throw new Error(
            `Adapter type [${
              adapter ? adapter.getType() : typeof adapter
            }] does not match requested type [${chain}]`
          )
        }
        this.instances.set(chain, adapter)
      }
    }

    if (!adapter) {
      throw new Error(`Network [${chain}] is not supported`)
    }

    return adapter as ChainAdapter<T>
  }
}
