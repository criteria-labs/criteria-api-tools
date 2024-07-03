import type { JSONPointer } from './types'

export function validateJSONPointer(value: unknown): value is JSONPointer {
  if (typeof value !== 'string' || (value !== '' && !value.startsWith('/'))) {
    throw new Error('Invalid JSON pointer')
  }
  return true
}
