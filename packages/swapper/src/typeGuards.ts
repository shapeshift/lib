export const isFulfilled = <T>(
  promise: PromiseSettledResult<T>,
): promise is PromiseFulfilledResult<T> => promise.status === 'fulfilled'
