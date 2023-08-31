import { JSONPointer } from '../util/JSONPointer'
import { Output } from './Output'

export function assert(
  condition: any,
  message: string,
  {
    schemaLocation,
    schemaKeyword,
    instanceLocation
  }: {
    schemaLocation: JSONPointer
    schemaKeyword?: string
    instanceLocation: JSONPointer
  }
): Output {
  if (condition) {
    return {
      valid: true,
      schemaLocation,
      schemaKeyword,
      instanceLocation
    }
  }
  return {
    valid: false,
    schemaLocation,
    schemaKeyword,
    instanceLocation,
    message
  }
}
