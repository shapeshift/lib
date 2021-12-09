import { YearnMarketCapService } from './yearn/yearn'
import { JsonRpcProvider } from '@ethersproject/providers'
import { Yearn } from '@yfi/sdk'

const main = async (): Promise<void> => {
  const provider = new JsonRpcProvider('https://dev-daemon.ethereum.shapeshift.com')
  const yearnSdk = new Yearn(1, { provider })
  const yearnMarketService = new YearnMarketCapService({ yearnSdk })
  const findAllData = await yearnMarketService.findAll()
  // console.log({ findAllData })
}

main().then(() => console.info('Done'))
