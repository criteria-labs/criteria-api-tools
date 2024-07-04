import { isJSONPointer, type JSONPointer } from './types'

export function validateJSONPointer(value: unknown): value is JSONPointer {
  if (isJSONPointer(value)) {
    return true
  }
  throw new Error('Invalid JSON pointer')
}
