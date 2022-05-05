// import { JsonRpcProvider } from '@ethersproject/providers'
import { HistoryTimeframe } from '@shapeshiftoss/types'

// import { HistoryTimeframe } from '@shapeshiftoss/types'
// import { Yearn } from '@yfi/sdk'
// import { CoinGeckoMarketService } from './coingecko/coingecko'
// import { YearnVaultMarketCapService } from './yearn/yearn-vaults'
// import { YearnTokenMarketCapService } from './yearn/yearn-tokens'
// import { OsmosisMarketService } from './osmosis/osmosis'
import { FOXY_CAIP19, FoxyMarketService } from './foxy/foxy'

const main = async (): Promise<void> => {
  // const caip19 = 'eip155:1/erc20:0xa258c4606ca8206d8aa700ce2143d7db854d168c' // WETH Vault
  // const caip19 = 'eip155:1/erc20:0x19d3364a399d251e894ac732651be8b0e4e85001' // yvDai Vault
  // const caip19 = 'eip155:1/erc20:0x5f18c75abdae578b483e5f43f12a39cf75b973a9' // USDC Vault
  // const caip19 = 'eip155:1/erc20:0xa696a63cc78dffa1a63e9e50587c197387ff6c7e' // BTC Vault
  // const caip19 = 'eip155:1/erc20:0x93ed140172ff226dad1f7f3650489b8daa07ae7f' // Zapper Token
  // const caip19 = 'eip155:1/erc20:0x3f1b0278a9ee595635b61817630cc19de792f506' // Zapper Token
  // const caip19 = 'cosmos:osmosis-1/slip44:118' // Osmosis
  const assetId = FOXY_CAIP19 // FOXy
  const timeframe = HistoryTimeframe.YEAR
  // const caip19 = 'bip122:000000000019d6689c085ae165831e93/slip44:0' // BTC
  // const provider = new JsonRpcProvider('https://daemon.ethereum.shapeshift.com')
  // const yearnSdk = new Yearn(1, { provider })
  // const yearnMarketService = new YearnTokenMarketCapService({ yearnSdk })
  // const osmosisMarketService = new OsmosisMarketService()
  const foxyMarketService = new FoxyMarketService()
  // const cgMarkteService = new CoinGeckoMarketService()
  // const data = await yearnMarketService.findAll()
  // const data = await yearnMarketService.findByCaip19({ caip19 })
  const data = await foxyMarketService.findPriceHistoryByCaip19({ assetId, timeframe })
  // const data = await foxyMarketService.findByCaip19({ caip19 })
  // const data = await foxyMarketService.findAll()
  // const data = await yearnMarketService.findAll()
  // const data = await cgMarkteService.findPriceHistoryByCaip19({
  //   caip19,
  //   timeframe: HistoryTimeframe.DAY
  // })
  console.log({ data })
}

main()
  .then(() => console.info('Done'))
  .then(() => process.exit(0))
