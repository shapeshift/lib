import { fromAssetId, toAssetId } from '@shapeshiftoss/caip'
import { ethereum } from '@shapeshiftoss/chain-adapters'
import { IdleInvestor } from '@shapeshiftoss/investor-idle'
import { MarketCapResult, MarketData, MarketDataArgs } from '@shapeshiftoss/types'
import * as unchained from '@shapeshiftoss/unchained-client'

import { MarketService } from '../api'
import { ProviderUrls } from '../market-service-manager'

export class IdleMarketService implements MarketService {
  baseUrl = ''
  providerUrls: ProviderUrls
  idleInvestor: IdleInvestor

  constructor({ providerUrls }: { providerUrls: ProviderUrls }) {
    this.providerUrls = providerUrls
    this.idleInvestor = new IdleInvestor({
      chainAdapter: new ethereum.ChainAdapter({
        providers: {
          ws: new unchained.ws.Client<unchained.ethereum.Tx>(
            this.providerUrls.unchainedEthereumWsUrl,
          ),
          http: new unchained.ethereum.V1Api(
            new unchained.ethereum.Configuration({
              basePath: this.providerUrls.unchainedEthereumHttpUrl,
            }),
          ),
        },
        rpcUrl: this.providerUrls.jsonRpcProviderUrl,
      }),
      providerUrl: this.providerUrls.jsonRpcProviderUrl,
    })
    ;(async () => {
      await this.idleInvestor.initialize()
    })()
  }

  async findAll() {
    const idleOpportunities = await this.idleInvestor.findAll()

    const marketDataById = idleOpportunities.reduce((acc, opportunity) => {
      const assetId = toAssetId({
        assetNamespace: 'erc20',
        assetReference: opportunity.id,
        chainId: fromAssetId(opportunity.feeAsset.assetId).chainId,
      })

      acc[assetId] = {
        price: opportunity.positionAsset.underlyingPerPosition.toFixed(),
        marketCap: '0', // TODO,
        volume: '0', // TODO:
        changePercent24Hr: 0, // TODO
      }

      return acc
    }, {} as MarketCapResult)

    return marketDataById
  }

  async findByAssetId({ assetId }: MarketDataArgs): Promise<MarketData | null> {
    const opportunity = await this.idleInvestor.findByOpportunityId(assetId)

    if (!opportunity) return null

    return {
      price: opportunity.positionAsset.underlyingPerPosition.toFixed(),
      marketCap: '0', // TODO,
      volume: '0', // TODO:
      changePercent24Hr: 0, // TODO
    }
  }

  async findPriceHistoryByAssetId() {
    return []
  }
}
