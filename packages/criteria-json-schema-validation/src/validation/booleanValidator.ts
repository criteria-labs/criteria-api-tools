import { JSONPointer } from '../util/JSONPointer'
import { BoundValidator } from './BoundValidator'

export function booleanValidator(schema: boolean, schemaPath: JSONPointer[]): BoundValidator {
  const schemaLocation = schemaPath.join('') as JSONPointer
  if (schema) {
    return (instance: unknown, instanceLocation: JSONPointer) => ({ valid: true, schemaLocation, instanceLocation })
  } else {
    return (instance: unknown, instanceLocation: JSONPointer) => ({
      valid: false,
      schemaLocation,
      instanceLocation,
      message: `should not be defined but is ${instance}`
    })
  }
}
