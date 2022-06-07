import { ChainId, isChainId } from '@shapeshiftoss/caip'
import { SUPPORTED_CHAIN_IDS, SupportedChainIds } from '@shapeshiftoss/types'
import * as unchained from '@shapeshiftoss/unchained-client'

import { ChainAdapter } from './api'
import * as bitcoin from './bitcoin'
import * as cosmos from './cosmossdk/cosmos'
import * as osmosis from './cosmossdk/osmosis'
import * as ethereum from './ethereum'

export type UnchainedUrl = {
  httpUrl: string
  wsUrl: string
}
export type UnchainedUrls = Partial<Record<SupportedChainIds, UnchainedUrl>>

export class ChainAdapterManager {
  private supported: Map<SupportedChainIds, () => ChainAdapter<SupportedChainIds>> = new Map()
  private instances: Map<SupportedChainIds, ChainAdapter<SupportedChainIds>> = new Map()

  constructor(unchainedUrls: UnchainedUrls) {
    if (!unchainedUrls) {
      throw new Error('Blockchain urls required')
    }
    ;(Object.entries(unchainedUrls) as Array<[keyof UnchainedUrls, UnchainedUrl]>).forEach(
      ([type, { httpUrl, wsUrl }]) => {
        switch (type) {
          case SUPPORTED_CHAIN_IDS.EthereumMainnet: {
            const http = new unchained.ethereum.V1Api(
              new unchained.ethereum.Configuration({ basePath: httpUrl })
            )
            const ws = new unchained.ws.Client<unchained.ethereum.ParsedTx>(wsUrl)
            return this.addChain(
              type,
              () =>
                new ethereum.ChainAdapter({
                  providers: { http, ws }
                }) as unknown as ChainAdapter<'eip155:1'> // FIXME
            )
          }
          case SUPPORTED_CHAIN_IDS.BitcoinMainnet: {
            const http = new unchained.bitcoin.V1Api(
              new unchained.bitcoin.Configuration({ basePath: httpUrl })
            )
            const ws = new unchained.ws.Client<unchained.Tx>(wsUrl)
            return this.addChain(
              type,
              () =>
                new bitcoin.ChainAdapter({
                  providers: { http, ws },
                  coinName: 'Bitcoin'
                }) as unknown as ChainAdapter<'bip122:000000000019d6689c085ae165831e93'> // FIXME
            )
          }

          case SUPPORTED_CHAIN_IDS.CosmosMainnet: {
            const http = new unchained.cosmos.V1Api(
              new unchained.cosmos.Configuration({ basePath: httpUrl })
            )
            const ws = new unchained.ws.Client<unchained.cosmos.Tx>(wsUrl)
            return this.addChain(
              type,
              () =>
                new cosmos.ChainAdapter({
                  providers: { http, ws },
                  coinName: 'Cosmos'
                }) as unknown as ChainAdapter<'cosmos:cosmoshub-4'> // FIXME
            )
          }

          case SUPPORTED_CHAIN_IDS.OsmosisMainnet: {
            const http = new unchained.osmosis.V1Api(
              new unchained.osmosis.Configuration({ basePath: httpUrl })
            )
            const ws = new unchained.ws.Client<unchained.osmosis.Tx>(wsUrl)
            return this.addChain(
              type,
              () =>
                new osmosis.ChainAdapter({
                  providers: { http, ws },
                  coinName: 'Osmosis'
                }) as unknown as ChainAdapter<'cosmos:osmosis-1'> // FIXME
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
   * @param {ChainTypes} chain - Coin/network symbol from Asset query
   * @param {Function} factory - A function that returns a ChainAdapter instance
   */
  addChain<T extends SupportedChainIds>(
    chain: T,
    factory: () => ChainAdapter<SupportedChainIds>
  ): void {
    if (typeof chain !== 'string' || typeof factory !== 'function') {
      throw new Error('Parameter validation error')
    }
    this.supported.set(chain, factory)
  }

  removeChain<T extends SupportedChainIds>(chain: T): void {
    // FIXME: This is gross
    if (!Object.values(SUPPORTED_CHAIN_IDS as unknown as T).includes(chain)) {
      throw new Error(`ChainAdapterManager: invalid chain ${chain}`)
    }
    if (!this.supported.has(chain)) {
      throw new Error(`ChainAdapterManager: chain ${chain} not registered`)
    }
    this.supported.delete(chain)
  }

  getSupportedChains(): Array<SupportedChainIds> {
    return Array.from(this.supported.keys())
  }

  getSupportedAdapters(): Array<() => ChainAdapter<SupportedChainIds>> {
    return Array.from(this.supported.values())
  }

  /*** Get a ChainAdapter instance for a network */
  byChain<T extends SupportedChainIds>(chain: T): ChainAdapter<T> {
    let adapter = this.instances.get(chain)
    if (!adapter) {
      const factory = this.supported.get(chain)
      if (factory) {
        adapter = factory()
        if (!adapter) {
          throw new Error(`Adapter not available for [${chain}]`)
        }
        this.instances.set(chain, adapter)
      }
    }

    if (!adapter) {
      throw new Error(`Network [${chain}] is not supported`)
    }

    return adapter as ChainAdapter<T>
  }

  byChainId(chainId: ChainId): ChainAdapter<SupportedChainIds> {
    // this function acts like a validation function and throws if the check doesn't pass
    isChainId(chainId)

    for (const [chain] of this.supported) {
      // byChain calls the factory function so we need to call it to create the instances
      const adapter = this.byChain(chain)
      if (adapter.getChainId() === chainId) return adapter
    }

    throw new Error(`Chain [${chainId}] is not supported`)
  }
}
