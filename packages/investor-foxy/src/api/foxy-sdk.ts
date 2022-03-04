import { JsonRpcProvider } from '@ethersproject/providers'

const network = 1 // 1 for mainnet
const provider = new JsonRpcProvider('http://127.0.0.1:8545/')
// export const yearnSdk = new Yearn(network, { provider, disableAllowlist: true })
