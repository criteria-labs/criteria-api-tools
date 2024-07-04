import type { JSONPointer } from '@criteria/json-pointer'
import { OutputFormat } from '..'
import { format } from '../util/format'
import { BoundValidator } from './BoundValidator'

export function booleanValidator(
  schema: boolean,
  schemaPath: JSONPointer[],
  { outputFormat }: { outputFormat: OutputFormat }
): BoundValidator {
  const schemaLocation = schemaPath.join('') as JSONPointer
  if (schema) {
    return (instance: unknown, instanceLocation: JSONPointer) => ({ valid: true, schemaLocation, instanceLocation })
  } else {
    return outputFormat === 'flag'
      ? (instance: unknown, instanceLocation: JSONPointer) => ({ valid: false })
      : (instance: unknown, instanceLocation: JSONPointer) => ({
          valid: false,
          schemaLocation,
          instanceLocation,
          message: `should not be defined but is ${format(instance)}`
        })
  }
}
