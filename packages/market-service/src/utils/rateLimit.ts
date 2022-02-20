import axios from 'axios'
import axiosRateLimit from 'axios-rate-limit'
import { pRateLimit } from 'p-ratelimit'

import { DEFAULT_RATE_LIMITER_INTERVAL_IN_MS } from '../config'

/**
 * can only be used with axios
 * @param rate max requests threshold
 * @param interval in miliseconds
 * @returns rate limited "axios"
 */
export const rateLimitedAxios = (rate: number, interval = DEFAULT_RATE_LIMITER_INTERVAL_IN_MS) =>
  axiosRateLimit(axios, { maxRequests: rate, perMilliseconds: interval })

/**
 * Generic rate limiter creator, can be used with any kind of functions
 * @param rate
 * @param interval
 * @returns rate limiter function wrappper
 * usage:
 *   const rateLimiter = createRateLimiter()
 *   rateLimiter(() => fn(...args))
 */
export const createRateLimiter = (rate: number, interval = DEFAULT_RATE_LIMITER_INTERVAL_IN_MS) =>
  pRateLimit({
    interval,
    rate
  })
