import axios from 'axios'
import http from 'http'

import { getRatelimitedAxios } from './getRatelimitedAxios'

const MAX_RPS = 10
// setting maxRequests to 10 and perMilliseconds to 1000 to make sure we don't send not more than 10 requests every second
const ratelimitedAxios = getRatelimitedAxios(MAX_RPS, 1000)

const apiCalls: number[] = []

const server = http
  .createServer((_req, res) => {
    if (apiCalls.length > MAX_RPS) {
      apiCalls.length = 0
      res.writeHead(429)
      return res.end()
    }
    if (Date.now() - apiCalls[0] > 1000) apiCalls.length = 0
    apiCalls.push(Date.now())
    res.writeHead(200)
    return res.end()
  })
  .listen(8080)

describe('axios rate limit', () => {
  it('gets rate limited', async () => {
    // using MAX_RPS * 2 here to demonstrate that it gets ratelimited
    for (let index = 0; index < MAX_RPS * 2; index++) {
      try {
        const resp = await axios.get('http://localhost:8080')
        expect(resp.status).toEqual(200)
      } catch (error) {
        // we need to do this conditionally as axios throws an error on 429
        // eslint-disable-next-line jest/no-conditional-expect
        expect(error.response.status).toEqual(429)
      }
    }
  })

  it('does not get rate limited', async () => {
    // making sure our api call history from the previous test is cleared
    apiCalls.length = 0
    // using MAX_RPS * 2 here to demonstrate that it does not get ratelimited
    for (let index = 0; index < MAX_RPS * 2; index++) {
      const resp = await ratelimitedAxios.get('http://localhost:8080')
      expect(resp.status).toEqual(200)
    }
  })
})

afterAll(() => {
  // gracefully shutting down the http server
  server.close()
})
