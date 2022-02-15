import { pRateLimit } from 'p-ratelimit'

import { YEARN_MAX_RPM } from '../constants'

// defaulting perMilliseconds to 60000 as both coingecko and coincap provide
export const yearnRatelimiter = (maxRequests = YEARN_MAX_RPM, interval = 60000) => {
  return pRateLimit({
    interval,
    rate: maxRequests
  })
}
