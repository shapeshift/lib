import { YearnMarketCapService } from './yearn/yearn'

const main = async (): Promise<void> => {
  const yearnMarketService = new YearnMarketCapService()
  const findAllData = await yearnMarketService.findAll()
  console.log({ findAllData })
}

main().then(() => console.info('Done'))
