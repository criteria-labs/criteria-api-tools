import { DereferencedJSONSchemaDraft04 } from '@criteria/json-schema'
import { JSONPointer } from '../../../../util/JSONPointer'
import { isJSONNumber } from '../../../../util/isJSONNumber'
import { assert } from '../../../../validation/assert'
import { ValidatorContext } from '../../../../validation/jsonValidator'
import { Output } from '../../../../validation/Output'

export function minimumValidator(
  schema: DereferencedJSONSchemaDraft04,
  schemaLocation: JSONPointer,
  context: ValidatorContext
) {
  if (!('minimum' in schema)) {
    return null
  }

  const minimum = schema['minimum']
  const exclusiveMinimum = schema['exclusiveMinimum'] ?? false
  return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
    if (!isJSONNumber(instance)) {
      return { valid: true, schemaLocation, instanceLocation }
    }

    return assert(
      exclusiveMinimum ? instance > minimum : instance >= minimum,
      `should be ${
        exclusiveMinimum ? 'greater than' : 'greater than or equal to'
      } ${minimum} but is ${instance} instead`,
      {
        schemaLocation,
        schemaKeyword: 'minimum',
        instanceLocation
      }
    )
  }
}
