import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../../util/JSONPointer'
import { isJSONNumber } from '../../../../util/isJSONNumber'
import { assert } from '../../../../validation/assert'
import { ValidatorContext } from '../../../../validation/jsonValidator'
import { Output } from '../../../../validation/Output'

export function multipleOfValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  context: ValidatorContext
) {
  if (!('multipleOf' in schema)) {
    return null
  }

  const multipleOf = schema['multipleOf']
  return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
    if (!isJSONNumber(instance)) {
      return { valid: true, schemaLocation, instanceLocation }
    }

    return assert(
      multipleOf !== 0 ? Number.isInteger(instance / multipleOf) : false,
      `should be a multiple of ${multipleOf} but is ${instance} instead`,
      { schemaLocation, schemaKeyword: 'multipleOf', instanceLocation }
    )
  }
}
