import { pRateLimit } from 'p-ratelimit'

import { YEARN_MAX_RPM } from '../constants'

export const yearnRatelimiter = (maxRequests = YEARN_MAX_RPM, interval = 60000) => {
  return pRateLimit({
    interval,
    rate: maxRequests
  })
}
