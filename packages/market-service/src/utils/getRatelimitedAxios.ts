import axios from 'axios'
import rateLimit from 'axios-rate-limit'

// defaulting perMilliseconds to 60000 as both coingecko and coincap provide
// xxx requests per minute (60000 ms) rate limits
export const getRatelimitedAxios = (maxRequests: number, perMilliseconds = 60000) => {
  return rateLimit(axios.create(), { maxRequests, perMilliseconds })
}
