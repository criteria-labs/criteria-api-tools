import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../../util/JSONPointer'
import { isJSONArray } from '../../../../util/isJSONArray'
import { assert } from '../../../../validation/assert'
import { ValidatorContext } from '../../../../validation/jsonValidator'
import { Output } from '../../../../validation/Output'

export function minItemsValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  context: ValidatorContext
) {
  if (!('minItems' in schema)) {
    return null
  }

  const minItems = schema['minItems']
  return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
    if (!isJSONArray(instance)) {
      return { valid: true, schemaLocation, instanceLocation }
    }

    return assert(
      instance.length >= minItems,
      minItems === 1
        ? `should have at least 1 item but has ${instance.length} instead`
        : `should have at least ${minItems} items but has ${instance.length} instead`,
      { schemaLocation, schemaKeyword: 'minItems', instanceLocation }
    )
  }
}