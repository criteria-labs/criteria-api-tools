export class SchemaError extends Error {
  constructor(message: string) {
    super(message)

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SchemaError)
    }

    this.name = 'SchemaError'

    // See https://github.com/microsoft/TypeScript/issues/13965
    Object.setPrototypeOf(this, SchemaError.prototype)
  }
}
