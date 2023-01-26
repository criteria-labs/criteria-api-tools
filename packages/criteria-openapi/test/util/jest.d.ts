declare global {
  namespace jest {
    interface Matchers<R> {
      toCircularEqual(expected: unknown): CustomMatcherResult
    }
  }
}

export {}
