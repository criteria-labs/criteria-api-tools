import { DereferencedJSONSchemaDraft04 } from '@criteria/json-schema'
import { JSONPointer } from '../../../../util/JSONPointer'
import { isJSONNumber } from '../../../../util/isJSONNumber'
import { assert } from '../../../../validation/assert'
import { ValidatorContext } from '../../../../validation/jsonValidator'
import { Output } from '../../../../validation/Output'

export function maximumValidator(
  schema: DereferencedJSONSchemaDraft04,
  schemaLocation: JSONPointer,
  context: ValidatorContext
) {
  if (!('maximum' in schema)) {
    return null
  }

  const maximum = schema['maximum']
  const exclusiveMaximum = schema['exclusiveMaximum'] ?? false
  return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
    if (!isJSONNumber(instance)) {
      return { valid: true, schemaLocation, instanceLocation }
    }

    return assert(
      exclusiveMaximum ? instance < maximum : instance <= maximum,
      `Expected number ${
        exclusiveMaximum ? 'less than' : 'less than or equal to'
      } ${maximum} but found ${instance} instead`,
      {
        schemaLocation,
        schemaKeyword: 'maximum',
        instanceLocation
      }
    )
  }
}
