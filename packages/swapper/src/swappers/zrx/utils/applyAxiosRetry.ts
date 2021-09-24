import { AxiosInstance, AxiosRequestConfig } from 'axios'
import { attach, RetryConfig } from 'retry-axios'

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>
type PartialRaxConfig = { raxConfig?: RetryConfig } & AxiosRequestConfig

export function applyAxiosRetry(
  instance: AxiosInstance,
  options?: Omit<RetryConfig, 'instance'>
): AxiosInstance {
  instance.interceptors.request.use((config: PartialRaxConfig) => {
    config.raxConfig = config.raxConfig || { instance, ...options }
    return config
  })

  attach(instance)
  return instance
}
