export type MaybePromise<T> = T | Promise<T>

export function isPromise<T>(value: MaybePromise<T>): value is Promise<T> {
  return typeof value === 'object' && value !== null && typeof (value as any).then === 'function'
}

// Similar to calling then() on a Promise,
// but returns synchronously if valueOrPromise is not a Promise
export function chain<T, U = void>(
  valueOrPromise: MaybePromise<T>,
  onFulfilled: (value: T) => MaybePromise<U>,
  onRejected?: (reason: any) => MaybePromise<U>
): MaybePromise<U> {
  if (isPromise(valueOrPromise)) {
    return valueOrPromise.then(onFulfilled, onRejected)
  } else {
    return onFulfilled(valueOrPromise)
  }
}
