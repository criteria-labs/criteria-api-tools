import { JSONSchema } from '@criteria/json-schema/draft-04'
import { JSONPointer } from '../../../../util/JSONPointer'
import { isJSONArray } from '../../../../util/isJSONArray'
import { Output } from '../../../../validation/Output'
import { assert } from '../../../../validation/assert'
import { ValidatorContext } from '../../../../validation/keywordValidators'

export function minItemsValidator(schema: JSONSchema, schemaPath: JSONPointer[], context: ValidatorContext) {
  if (!('minItems' in schema)) {
    return null
  }

  const minItems = schema['minItems']
  const schemaLocation = schemaPath.join('') as JSONPointer
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
