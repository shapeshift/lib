import { JsonRpcProvider } from '@ethersproject/providers'
import { Yearn } from '@yfi/sdk'

const provider = new JsonRpcProvider(process.env.REACT_APP_UNCHAINED_ETHEREUM_HTTP_URL)
export const yearnSdk = new Yearn(1, { provider })
