import { JsonRpcProvider } from '@ethersproject/providers'
import { Yearn } from '@yfi/sdk'

// YearnMarketCapService deps
const provider = new JsonRpcProvider('https://dev-api.ethereum.shapeshift.com')
export const yearnSdk = new Yearn(1, { provider })
