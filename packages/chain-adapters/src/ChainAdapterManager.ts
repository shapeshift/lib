import { ChainAdapter, ChainIdentifier } from './api'
import { BitcoinChainAdapter } from './bitcoin'
import { EthereumChainAdapter } from './ethereum'
import { Ethereum, Bitcoin } from '@shapeshiftoss/unchained-client'

export type UnchainedUrls = Record<ChainIdentifier.Ethereum | ChainIdentifier.Bitcoin, string>

const chainAdapters = {
  [ChainIdentifier.Bitcoin]: (url: string): BitcoinChainAdapter => {
    const provider = new Bitcoin.V1Api(new Bitcoin.Configuration({ basePath: url }))
    return new BitcoinChainAdapter({ provider })
  },
  [ChainIdentifier.Ethereum]: (url: string): EthereumChainAdapter => {
    const provider = new Ethereum.V1Api(new Ethereum.Configuration({ basePath: url }))
    return new EthereumChainAdapter({ provider })
  }
} as const

type ChainAdapterKeys = keyof typeof chainAdapters

export class ChainAdapterManager {
  private supported: Map<ChainAdapterKeys, () => ChainAdapter> = new Map()
  private instances: Map<string, ChainAdapter> = new Map()

  constructor(unchainedUrls: UnchainedUrls) {
    if (!unchainedUrls) {
      throw new Error('Blockchain urls required')
    }
    ;(Object.keys(unchainedUrls) as Array<ChainAdapterKeys>).forEach((key) => {
      const Adapter = chainAdapters[key]
      if (!Adapter) throw new Error(`No chain adapter for ${key}`)
      this.addChain(key, () => Adapter(unchainedUrls[key]))
    })
  }

  /**
   * Add support for a network by providing a class that implements ChainAdapter
   *
   * @example
   * import { ChainAdapterManager, UtxoChainAdapter } from 'chain-adapters'
   * const manager = new ChainAdapterManager(client)
   * manager.addChain('BTG', () => new UtxoChainAdapter('BTG', client))
   * @param {ChainAdapterKeys} network - Coin/network symbol from Asset query
   * @param {Function} factory - A function that returns a ChainAdapter instance
   */
  addChain(chain: ChainAdapterKeys, factory: () => ChainAdapter): void {
    if (typeof chain !== 'string' || typeof factory !== 'function') {
      throw new Error('Parameter validation error')
    }
    this.supported.set(chain, factory)
  }

  getSupportedChains(): Array<ChainAdapterKeys> {
    return Array.from(this.supported.keys())
  }

  getSupportedAdapters(): Array<() => ChainAdapter> {
    return Array.from(this.supported.values())
  }

  /**
   * Get a ChainAdapter instance for a network
   */
  byChain(chain: ChainAdapterKeys): ChainAdapter {
    let adapter = this.instances.get(chain)
    if (!adapter) {
      const factory = this.supported.get(chain)
      if (factory) {
        this.instances.set(chain, factory())
        adapter = this.instances.get(chain)
      }
    }

    if (!adapter) {
      throw new Error(`Network [${chain}] is not supported`)
    }

    return adapter
  }
}
