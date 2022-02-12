import axios from 'axios'
import rateLimit from 'axios-rate-limit'

export const getRatelimitedAxios = (rps: number) => {
  return rateLimit(axios.create(), { maxRequests: rps, perMilliseconds: 1000, maxRPS: rps })
}
