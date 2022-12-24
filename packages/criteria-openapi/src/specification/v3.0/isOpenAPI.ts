import { OpenAPI } from './types'

interface Options {
  /**
   * A function to validate a value as an OpenAPI object.
   * The function should throw an error if the value is not
   * a valid OpenAPI object.
   *
   * @param value The value to validate as an OpenAPI object.
   * @returns void.
   */
  validate?: (value: any) => void
}

export function isOpenAPI(value: any, options?: Options): value is OpenAPI {
  if (typeof options?.validate === 'function') {
    try {
      options.validate(value)
      return true
    } catch {
      return false
    }
  } else {
    return typeof value === 'object' && 'openapi' in value && value['openapi'] === '3.0.3'
  }
}
