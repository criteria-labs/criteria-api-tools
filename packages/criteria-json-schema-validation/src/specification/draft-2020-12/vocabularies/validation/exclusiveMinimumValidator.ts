import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../../util/JSONPointer'
import { isJSONNumber } from '../../../../util/isJSONNumber'
import { assert } from '../../../../validation/assert'
import { ValidatorContext } from '../../../../validation/jsonValidator'
import { Output } from '../../../../validation/Output'

export function exclusiveMinimumValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  context: ValidatorContext
) {
  if (!('exclusiveMinimum' in schema)) {
    return null
  }

  const exclusiveMinimum = schema['exclusiveMinimum']
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