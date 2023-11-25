import { JSONSchema } from '@criteria/json-schema/draft-04'
import { JSONPointer } from '../../../../util/JSONPointer'
import { isJSONNumber } from '../../../../util/isJSONNumber'
import { Output } from '../../../../validation/Output'
import { assert } from '../../../../validation/assert'
import { ValidatorContext } from '../../../../validation/keywordValidators'

export function maximumValidator(schema: JSONSchema, schemaPath: JSONPointer[], context: ValidatorContext) {
  if (!('maximum' in schema)) {
    return null
  }

  const maximum = schema['maximum']
  const exclusiveMaximum = schema['exclusiveMaximum'] ?? false
  const schemaLocation = schemaPath.join('') as JSONPointer
  return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
    if (!isJSONNumber(instance)) {
      return { valid: true, schemaLocation, instanceLocation }
    }

    return assert(
      exclusiveMaximum ? instance < maximum : instance <= maximum,
      `should be ${exclusiveMaximum ? 'less than' : 'less than or equal to'} ${maximum} but is ${instance} instead`,
      {
        schemaLocation,
        schemaKeyword: 'maximum',
        instanceLocation
      }
    )
  }
}
