import { AssertionError } from 'assert'
import { setupCache } from 'axios-cache-adapter'

// asserts x is type doesn't work when using arrow functions
export function assertIsDefined<T>(val: T): asserts val is NonNullable<T> {
  if (val === undefined || val === null) {
    throw new AssertionError({ message: `Expected 'val' to be defined, but received ${val}` })
  }
}

const getRequestFilter = (cachedUrls: string[]) => (request: Request) =>
  !cachedUrls.some((url) => request.url.includes(url))

export const createCache = (maxAge: number, cachedUrls: string[]) =>
  setupCache({
    maxAge,
    exclude: { filter: getRequestFilter(cachedUrls) },
  })
