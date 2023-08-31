import { Output } from '../validation/Output'

export class ValidationError extends Error {
  readonly output: Output
  constructor(message: string, options: { output: Output }) {
    super(message)

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError)
    }

    this.name = 'ValidationError'
    this.output = options.output

    // See https://github.com/microsoft/TypeScript/issues/13965
    Object.setPrototypeOf(this, ValidationError.prototype)
  }
}
