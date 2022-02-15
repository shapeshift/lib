import axios from 'axios'
import axiosRateLimit from 'axios-rate-limit'

// defaulting perMilliseconds to 60000 as both coingecko and coincap provide
// xxx requests per minute (60000 ms) rate limits
export const getRatelimitedAxios = (maxRequests: number, interval = 60000) => {
  return axiosRateLimit(axios, { maxRequests, perMilliseconds: interval })
}
