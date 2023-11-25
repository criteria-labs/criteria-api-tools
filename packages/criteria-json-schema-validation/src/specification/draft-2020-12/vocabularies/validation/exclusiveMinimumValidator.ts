import { JSONSchemaObject } from '@criteria/json-schema/draft-2020-12'
import { JSONPointer } from '../../../../util/JSONPointer'
import { isJSONNumber } from '../../../../util/isJSONNumber'
import { Output } from '../../../../validation/Output'
import { assert } from '../../../../validation/assert'
import { ValidatorContext } from '../../../../validation/keywordValidators'

export function exclusiveMinimumValidator(
  schema: JSONSchemaObject,
  schemaPath: JSONPointer[],
  context: ValidatorContext
) {
  if (!('exclusiveMinimum' in schema)) {
    return null
  }

  const exclusiveMinimum = schema['exclusiveMinimum']
  const schemaLocation = schemaPath.join('') as JSONPointer
  return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
    if (!isJSONNumber(instance)) {
      return { valid: true, schemaLocation, instanceLocation }
    }

    return assert(
      instance > exclusiveMinimum,
      `should be greater than ${exclusiveMinimum} but is ${instance} instead`,
      { schemaLocation, schemaKeyword: 'exclusiveMinimum', instanceLocation }
    )
  }
}
