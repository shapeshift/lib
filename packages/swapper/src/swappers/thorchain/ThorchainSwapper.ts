import { Asset } from '@shapeshiftoss/asset-service'
import { Swapper, SwapperType } from '../../api'

export class ThorchainSwapper implements Swapper {
  availableAssets(assets: Asset[]): Asset[] {
    console.info(assets)
    throw new Error('Method not implemented.')
  }
  canTradePair(sellAsset: Asset, buyAsset: Asset): boolean {
    console.info(sellAsset, buyAsset)
    throw new Error('Method not implemented.')
  }
  getType() {
    return SwapperType.Thorchain
  }

  async getQuote() {
    return undefined
  }
}
