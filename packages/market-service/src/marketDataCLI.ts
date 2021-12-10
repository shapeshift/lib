import { JsonRpcProvider } from '@ethersproject/providers'
import { Yearn } from '@yfi/sdk'

import { YearnMarketCapService } from './yearn/yearn'

const main = async (): Promise<void> => {
  const caip19 = 'eip155:1/erc20:0xa258c4606ca8206d8aa700ce2143d7db854d168c' // WETH Vault
  // const caip19 = 'eip155:1/erc20:0x5f18c75abdae578b483e5f43f12a39cf75b973a9' // USDC Vault
  // const caip19 = 'eip155:1/erc20:0xa696a63cc78dffa1a63e9e50587c197387ff6c7e' // BTC Vault
  const provider = new JsonRpcProvider('https://dev-daemon.ethereum.shapeshift.com')
  const yearnSdk = new Yearn(1, { provider })
  const yearnMarketService = new YearnMarketCapService({ yearnSdk })
  // const data = await yearnMarketService.findAll()
  const data = await yearnMarketService.findByCaip19({ caip19 })
  console.log({ data })
}

main().then(() => console.info('Done'))
