import axios, { AxiosAdapter, AxiosRequestConfig } from 'axios'
import { RateLimiter as ServerRateLimiter } from 'limiter'

import { createRateLimiter, rateLimitedAxios } from './rateLimiters'

describe('rate limiters utilities', () => {
  describe('should get rate limited', () => {
    it('using rateLimitedAxios', async () => {
      const totalRequests = 30

      let successCount = 0
      const axiosAdapterLimiterRate = 2
      const axiosAdapterLimiterInterval = 100
      /**
       * this is for testing a service that has a rate limiter
       */
      const axiosAdapterLimiter = new ServerRateLimiter({
        tokensPerInterval: axiosAdapterLimiterRate,
        interval: axiosAdapterLimiterInterval,
        fireImmediately: true
      })

      async function axiosTestAdapter(config: AxiosRequestConfig) {
        const remainingRequests = await axiosAdapterLimiter.removeTokens(1)

        // exeeded rate limiter
        if (remainingRequests < 0) {
          return Promise.reject({ status: 429 })
        }
        return Promise.resolve(config)
      }

      const testAxiosInstance = axios.create({ adapter: axiosTestAdapter as AxiosAdapter })

      const onSuccess = () => successCount++
      let errorStatus = null

      for (let i = 0; i < totalRequests; i++) {
        await testAxiosInstance
          .get('/')
          .then(onSuccess)
          .catch(({ status }) => {
            errorStatus = status
          })
      }

      expect(successCount).toBeLessThan(totalRequests)
      expect(errorStatus).toBe(429)
    })

    it('using createRateLimiter', async () => {
      const totalCalls = 400

      const rateLimiterRate = 100
      const rateLimiterInterval = 10
      let successCount = 0
      let errorStatus = null

      const functionLimiter = new ServerRateLimiter({
        tokensPerInterval: rateLimiterRate,
        interval: rateLimiterInterval,
        fireImmediately: true
      })

      const functionToBeCalled = async () => {
        const remainingCalls = await functionLimiter.removeTokens(1)
        // exeeded rate limiter
        if (remainingCalls < 0) {
          return Promise.reject({ status: 429 })
        }
        return Promise.resolve(true)
      }

      const onSuccess = () => successCount++

      for (let i = 0; i < totalCalls; i++) {
        await functionToBeCalled()
          .then(onSuccess)
          .catch(({ status }) => {
            errorStatus = status
          })
      }

      expect(errorStatus).toEqual(429)
      expect(successCount).toBeLessThan(totalCalls)
    })
  })

  describe('should not get rate limited', () => {
    it('using rateLimitedAxios', async () => {
      const totalRequests = 30

      let successCount = 0
      const axiosAdapterLimiterRate = 2
      const axiosAdapterLimiterInterval = 100
      /**
       * this is for testing a service that has a rate limiter
       */
      const axiosAdapterLimiter = new ServerRateLimiter({
        tokensPerInterval: axiosAdapterLimiterRate,
        interval: axiosAdapterLimiterInterval,
        fireImmediately: true
      })

      async function axiosTestAdapter(config: AxiosRequestConfig) {
        const remainingRequests = await axiosAdapterLimiter.removeTokens(1)
        // exeeded rate limiter
        if (remainingRequests < 0) {
          return Promise.reject({ status: 429 })
        }
        return Promise.resolve(config)
      }

      const testAxiosInstance = rateLimitedAxios(
        axiosAdapterLimiterRate,
        axiosAdapterLimiterInterval,
        axios.create({ adapter: axiosTestAdapter as AxiosAdapter })
      )

      const onSuccess = () => successCount++

      let errorStatus = null
      const start = Date.now()
      for (let i = 0; i < totalRequests; i++) {
        await testAxiosInstance
          .get('/')
          .then(onSuccess)
          .catch(({ status }) => {
            errorStatus = status
          })
      }
      const end = Date.now()

      /**
       * Ensure all requests have been processed
       * and time elapsed must be greater than
       * (totalRequests / axiosAdapterLimiterRate - 1) * axiosAdapterLimiterInterval
       * so that we know it's not getting rate limited
       */
      expect(errorStatus).toBeNull()
      expect(successCount).toEqual(totalRequests)
      expect(end - start).toBeGreaterThan(
        (totalRequests / axiosAdapterLimiterRate - 1) * axiosAdapterLimiterInterval
      )
    })

    it('using createRateLimiter', async () => {
      const totalCalls = 400

      const rateLimiterRate = 100
      const rateLimiterInterval = 10
      let successCount = 0
      let errorStatus = null

      const rateLimiter = createRateLimiter(rateLimiterRate, rateLimiterInterval)

      const functionLimiter = new ServerRateLimiter({
        tokensPerInterval: rateLimiterRate,
        interval: rateLimiterInterval,
        fireImmediately: true
      })

      const functionToBeCalled = async () => {
        const remainingCalls = await functionLimiter.removeTokens(1)
        // exeeded rate limiter
        if (remainingCalls < 0) {
          return Promise.reject({ status: 429 })
        }
        return Promise.resolve(true)
      }

      const onSuccess = () => successCount++

      const start = Date.now()
      for (let i = 0; i < totalCalls; i++) {
        await rateLimiter(() => functionToBeCalled())
          .then(onSuccess)
          .catch(({ status }) => {
            errorStatus = status
          })
      }
      const end = Date.now()

      /**
       * Ensure all calls have been processed
       * and time elapsed must be greater than
       * `(totalCalls / rateLimiterRate - 1) * rateLimiterInterval`
       * so that we know its not getting rate limited
       */
      expect(errorStatus).toBeNull()
      expect(successCount).toEqual(totalCalls)
      expect(end - start).toBeGreaterThan((totalCalls / rateLimiterRate - 1) * rateLimiterInterval)
    })
  })
})
