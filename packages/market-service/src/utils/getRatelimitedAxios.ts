import axios from 'axios'
import rateLimit from 'axios-rate-limit'

export const getRatelimitedAxios = (rps: number, perMilliseconds = 1000) => {
  return rateLimit(axios.create(), { maxRequests: rps, perMilliseconds })
}
