import { JSONSchemaObject } from '@criteria/json-schema/draft-06'
import { JSONPointer } from '../../../../util/JSONPointer'
import { format } from '../../../../util/format'
import { isJSONNumber } from '../../../../util/isJSONNumber'
import { Output } from '../../../../validation/Output'
import { assert } from '../../../../validation/assert'
import { ValidatorContext } from '../../../../validation/keywordValidators'

export function exclusiveMaximumValidator(
  schema: JSONSchemaObject,
  schemaPath: JSONPointer[],
  context: ValidatorContext
) {
  if (!('exclusiveMaximum' in schema)) {
    return null
  }

  const exclusiveMaximum = schema['exclusiveMaximum']
  const schemaLocation = schemaPath.join('') as JSONPointer
  return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
    if (!isJSONNumber(instance)) {
      return { valid: true, schemaLocation, instanceLocation }
    }

    return assert(
      instance < exclusiveMaximum,
      `should be less than ${exclusiveMaximum} but is ${format(instance)} instead`,
      {
        schemaLocation,
        schemaKeyword: 'exclusiveMaximum',
        instanceLocation
      }
    )
  }
}
