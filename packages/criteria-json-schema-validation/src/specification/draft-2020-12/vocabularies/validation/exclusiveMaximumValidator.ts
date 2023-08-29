import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../../util/JSONPointer'
import { isJSONNumber } from '../../../../util/isJSONNumber'
import { ValidatorContext } from '../../../../validation/jsonValidator'
import { Output } from '../../../../validation/Output'
import { assert } from '../../../../validation/assert'

export function exclusiveMaximumValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  context: ValidatorContext
) {
  if (!('exclusiveMaximum' in schema)) {
    return null
  }

  const exclusiveMaximum = schema['exclusiveMaximum']
  return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
    if (!isJSONNumber(instance)) {
      return { valid: true, schemaLocation, instanceLocation }
    }

    return assert(
      instance < exclusiveMaximum,
      `Expected number less than ${exclusiveMaximum} but found ${instance} instead`,
      {
        schemaLocation,
        schemaKeyword: 'exclusiveMaximum',
        instanceLocation
      }
    )
  }
}
