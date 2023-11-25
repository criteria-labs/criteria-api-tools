import { JSONSchema } from '@criteria/json-schema/draft-04'
import { JSONPointer } from '../../../../util/JSONPointer'
import { isJSONNumber } from '../../../../util/isJSONNumber'
import { Output } from '../../../../validation/Output'
import { assert } from '../../../../validation/assert'
import { ValidatorContext } from '../../../../validation/keywordValidators'

export function minimumValidator(schema: JSONSchema, schemaPath: JSONPointer[], context: ValidatorContext) {
  if (!('minimum' in schema)) {
    return null
  }

  const minimum = schema['minimum']
  const exclusiveMinimum = schema['exclusiveMinimum'] ?? false
  const schemaLocation = schemaPath.join('') as JSONPointer
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
