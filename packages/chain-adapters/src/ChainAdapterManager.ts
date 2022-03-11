import { CAIP2, caip2, WellKnownAsset, WellKnownChain } from '@shapeshiftoss/caip'
import { ChainAdapterType } from '@shapeshiftoss/types'
import * as unchained from '@shapeshiftoss/unchained-client'

import { ChainAdapter } from './api'
import * as bitcoin from './bitcoin'
import * as cosmos from './cosmossdk/cosmos'
import * as ethereum from './ethereum'

export type UnchainedUrl = {
  httpUrl: string
  wsUrl: string
}
export type UnchainedUrls = Partial<Record<CAIP2, UnchainedUrl>>

export type ChainTypeForCAIP2<T extends CAIP2> = T extends
  | typeof WellKnownChain.EthereumMainnet
  | typeof WellKnownChain.EthereumRopsten
  | typeof WellKnownChain.EthereumRinkeby
  | typeof WellKnownChain.EthereumKovan
  ? ChainAdapterType.Ethereum
  : T extends typeof WellKnownChain.BitcoinMainnet | typeof WellKnownChain.BitcoinTestnet
  ? ChainAdapterType.Bitcoin
  : T extends typeof WellKnownChain.CosmosHubMainnet | typeof WellKnownChain.CosmosHubVega
  ? ChainAdapterType.Cosmos
  : T extends typeof WellKnownChain.OsmosisMainnet | typeof WellKnownChain.OsmosisTestnet
  ? ChainAdapterType.Osmosis
  : ChainAdapterType

export class ChainAdapterManager {
  private supported: Map<CAIP2, () => ChainAdapter<ChainAdapterType>> = new Map()
  private instances: Map<CAIP2, ChainAdapter<ChainAdapterType>> = new Map()

  constructor(unchainedUrls: UnchainedUrls) {
    if (!unchainedUrls) {
      throw new Error('Blockchain urls required')
    }
    ;(Object.entries(unchainedUrls) as Array<[keyof UnchainedUrls, UnchainedUrl]>).forEach(
      ([chainId, { httpUrl, wsUrl }]) => {
        switch (chainId) {
          case WellKnownChain.EthereumMainnet:
          case WellKnownChain.EthereumRopsten:
          case WellKnownChain.EthereumRinkeby:
          case WellKnownChain.EthereumKovan: {
            const http = new unchained.ethereum.V1Api(
              new unchained.ethereum.Configuration({ basePath: httpUrl })
            )
            const ws = new unchained.ws.Client<unchained.SequencedTx>(wsUrl)
            return this.addChain(
              chainId,
              () =>
                new ethereum.ChainAdapter({
                  providers: { http, ws },
                  chainId: WellKnownChain.EthereumMainnet,
                  assetId: WellKnownAsset.ETH
                })
            )
          }
          case WellKnownChain.BitcoinMainnet:
          case WellKnownChain.BitcoinTestnet: {
            const http = new unchained.bitcoin.V1Api(
              new unchained.bitcoin.Configuration({ basePath: httpUrl })
            )
            const ws = new unchained.ws.Client<unchained.SequencedTx>(wsUrl)
            return this.addChain(
              chainId,
              () =>
                new bitcoin.ChainAdapter({
                  providers: { http, ws },
                  chainId: WellKnownChain.BitcoinMainnet,
                  assetId: WellKnownAsset.BTC,
                  coinName: 'bitcoin'
                })
            )
          }
          case WellKnownChain.CosmosHubMainnet:
          case WellKnownChain.CosmosHubVega: {
            const http = new unchained.cosmos.V1Api(
              new unchained.cosmos.Configuration({ basePath: httpUrl })
            )
            const ws = new unchained.ws.Client<unchained.cosmos.Tx>(wsUrl)
            return this.addChain(
              chainId,
              () =>
                new cosmos.ChainAdapter({
                  providers: { http, ws },
                  chainId: WellKnownChain.CosmosHubMainnet,
                  assetId: WellKnownAsset.ATOM
                })
            )
          }
          default:
            throw new Error(`ChainAdapterManager: cannot instantiate ${chainId} chain adapter`)
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
   * @param {ChainAdapterType} chainId - Coin/network symbol from Asset query
   * @param {Function} factory - A function that returns a ChainAdapter instance
   */
  addChain<T extends CAIP2>(chainId: T, factory: () => ChainAdapter<ChainTypeForCAIP2<T>>): void {
    if (!caip2.isCAIP2(chainId) || typeof factory !== 'function') {
      throw new Error('Parameter validation error')
    }
    this.supported.set(chainId, factory as () => ChainAdapter<ChainAdapterType>)
  }

  getSupportedChains(): Array<CAIP2> {
    return Array.from(this.supported.keys())
  }

  getSupportedAdapters(): Array<() => ChainAdapter<ChainAdapterType>> {
    return Array.from(this.supported.values())
  }

  async byChainId<T extends CAIP2>(chainId: T): Promise<ChainAdapter<ChainTypeForCAIP2<T>>> {
    let adapter = this.instances.get(chainId)
    if (!adapter) {
      const factory = this.supported.get(chainId)
      if (factory) {
        adapter = factory()
        if (!adapter) {
          throw new Error(`Adapter not available for [${chainId}]`)
        }
        this.instances.set(chainId, adapter)
      }
    }

    if (!adapter) {
      throw new Error(`Chain ID [${chainId}] is not supported`)
    }

    return adapter as ChainAdapter<ChainTypeForCAIP2<T>>
  }
}
